import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import supabase from '../helper/supabaseClient.js';
import { motion, AnimatePresence } from 'framer-motion';
import { FaInfoCircle } from "react-icons/fa";
import { MapContainer, GeoJSON, useMap } from "react-leaflet";
import '../styles/QuizQuestion.less';
import "leaflet/dist/leaflet.css";

function FitBounds({ geoJsonData }) {
  const map = useMap();

  useEffect(() => {
    if (!geoJsonData) return;

    const geoJsonLayer = L.geoJSON(geoJsonData);
    map.fitBounds(geoJsonLayer.getBounds(), {
      padding: [10, 10],
    });
  }, [geoJsonData, map]);

  return null;
}


export default function QuizQuestion() {

  const { session_id } = useParams();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [sessionData, setSessionData] = useState(null);
  const [questionData, setQuestionData] = useState(null);
  const [choices, setChoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [answered, setAnswered] = useState(false);
  const [timer, setTimer] = useState(0);
  const [inputAnswer, setInputAnswer] = useState("");
  const [inputError, setInputError] = useState("");
  const [shownAt, setShownAt] = useState(Date.now());
  const [isAnsCorrect, setIsAnsCorrect] = useState(null);
  const [numCorrectChoices, setNumCorrectChoices] = useState(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Hints
  const [limitedChoices, setLimitedChoices] = useState(null);
  const [maskedAnswer, setMaskedAnswer] = useState(null);
  const [usedHintsLocal, setUsedHintsLocal] = useState({
    fifty_fifty: false,
    reveal: false,
    masked: false,
  });

  const difficultyMultipliers = {
    easy: 2,
    medium: 3,
    hard: 5
  };

  const hintPenalties = {
    fifty_fifty: 1,
    reveal: 3,
    masked: 2
  };


  useEffect(() => {
    const fetchSession = async () => {
      setLoading(true);

      const { data: sessionRes, error: sessionError } = await supabase
        .from('quiz_sessions')
        .select(`
          *,
          quiz_questions:quiz_questions (
            quiz_question_id,
            question_order,
            user_answer,
            is_correct,
            attempts,
            is_hint_used,
            hints_used,
            answer_time_seconds,
            question:questions (
              question_text,
              question_img,
              question_id,
              country_id,
              correct_answer
            )
          ),
          subcategory:subcategories (
            subcategory_name,
            category:categories (
              category_name
            )
          )
        `)
        .eq('session_id', session_id)
        .single();

      if (sessionError) {
        console.error("Session not found", sessionError);
        setLoading(false);
        return;
      }

      setSessionData(sessionRes);
      setLoading(false);
    };

    fetchSession();
  }, [session_id]);

  useEffect(() => {
    if (!sessionData) return;

    const questionRow = sessionData.quiz_questions[currentQuestionIndex];
    if (!questionRow) return;

    const fetchQuestionDetails = async () => {
      setLoading(true);
      setAnswered(false);
      setSelected([]);
      setIsAnsCorrect(null);
      setMaskedAnswer(null);
      setLimitedChoices(null);
      setUsedHintsLocal({
        fifty_fifty: false,
        reveal: false,
        masked: false,
      });
      setShownAt(Date.now());

      const { data: choicesData, error: choicesError } = await supabase.rpc("get_question_dynamic_choices", {
        p_question_id: questionRow.question.question_id,
        p_subcategory_id: sessionData.subcategory_id,
        p_difficulty: sessionData.difficulty,
        p_include_dependencies: sessionData.with_dependencies
      });

      if (choicesError) console.error("Error fetching choices:", choicesError);

      const labels = ['A', 'B', 'C', 'D', 'E', 'F'];

      let shuffledChoices = (choicesData || []).sort(() => Math.random() - 0.5).map((c, i) => ({ ...c, label: labels[i] }));
      let shapeData = null;

      if ( sessionData.subcategory?.category?.category_name === "Country Shapes" && questionRow.question.country_id) {
        const { data: shapeRes, error: shapeError } = await supabase
          .from('country_shapes')
          .select('geom')
          .eq('country_id', questionRow.question.country_id)
          .single();
        
        if (!shapeError && shapeRes) shapeData = shapeRes.geom;
      }

      setQuestionData({ ...questionRow, shape: shapeData });
      setChoices(shuffledChoices);
      setNumCorrectChoices(shuffledChoices.filter(c => c.is_correct).length);
      setLoading(false);
    };

    fetchQuestionDetails();
  }, [sessionData, currentQuestionIndex]);


  useEffect(() => {
    if (!sessionData) return;

    const start = new Date(sessionData.started_at).getTime();
    const updateTimer = () => setTimer(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    updateTimer();

    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [sessionData]);

  
  useEffect(() => {
    if (!questionData) return;

    setInputAnswer("");
    setAnswered(false);
    setSelected([]);
    setIsAnsCorrect(null);

    if (sessionData?.difficulty === "hard" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [questionData, sessionData]);

  const applyHint = async (penalty) => {
    try {
      const newHintsUsed = (questionData.hints_used || 0) + 1;

      await supabase
        .from('quiz_questions')
        .update({
          is_hint_used: true,
          hints_used: newHintsUsed
        })
        .eq('quiz_question_id', questionData.quiz_question_id);
    } catch (err) {
      
    }
  }

  const handleChoiceClick = async (choice) => {
    if (answered) return;

    const updatedSelected = selected.includes(choice.label)
      ? selected.filter(l => l !== choice.label)
      : [...selected, choice.label];
    setSelected(updatedSelected);

    const selectedChoices = choices.filter(c => updatedSelected.includes(c.label));
    const isLast = currentQuestionIndex + 1 >= sessionData.quiz_questions.length;
    const multiplier = difficultyMultipliers[sessionData.difficulty] || 1;

    if (numCorrectChoices === 1) {
      const isCorrect = choice.is_correct;
      setIsAnsCorrect(isCorrect);
      setAnswered(true);

      const pointsForThisQuestion = isCorrect ? multiplier : 0;

      await supabase
        .from("quiz_questions")
        .update({
          user_answer: [choice.choice_text],
          is_correct: isCorrect,
          answer_time_seconds: Math.floor((Date.now() - shownAt) / 1000),
        })
        .eq("quiz_question_id", questionData.quiz_question_id);

      await supabase.rpc("increment_quiz_session_totals", {
        p_session_id: session_id,
        p_inc_correct: isCorrect ? 1 : 0,
        p_inc_incorrect: isCorrect ? 0 : 1,
        p_add_points: pointsForThisQuestion,
        p_mark_completed: isLast,
      });

      return goToNextQuestion();
    }

    const incorrectSelected = selectedChoices.some(c => !c.is_correct);

    if (incorrectSelected) {
      setIsAnsCorrect(false);
      setAnswered(true);

      const pointsForThisQuestion = 0;

      await supabase
        .from("quiz_questions")
        .update({
          user_answer: selectedChoices.map(c => c.choice_text),
          is_correct: false,
          answer_time_seconds: Math.floor((Date.now() - shownAt) / 1000),
        })
        .eq("quiz_question_id", questionData.quiz_question_id);

      await supabase.rpc("increment_quiz_session_totals", {
        p_session_id: session_id,
        p_inc_correct: 0,
        p_inc_incorrect: 1,
        p_add_points: pointsForThisQuestion,
        p_mark_completed: isLast,
      });

      return goToNextQuestion();
    }

    const allCorrectSelected = choices
      .filter(c => c.is_correct)
      .every(c => updatedSelected.includes(c.label));

    if (allCorrectSelected) {
      setIsAnsCorrect(true);
      setAnswered(true);

      const pointsForThisQuestion = multiplier;

      await supabase
        .from("quiz_questions")
        .update({
          user_answer: selectedChoices.map(c => c.choice_text),
          is_correct: true,
          answer_time_seconds: Math.floor((Date.now() - shownAt) / 1000),
        })
        .eq("quiz_question_id", questionData.quiz_question_id);

      await supabase.rpc("increment_quiz_session_totals", {
        p_session_id: session_id,
        p_inc_correct: 1,
        p_inc_incorrect: 0,
        p_add_points: pointsForThisQuestion,
        p_mark_completed: isLast,
      });

      return goToNextQuestion();
    }
  };


  const handleInputSubmit = async () => {
    if (answered) return;

    const userAnswers = inputAnswer
      .split(",")
      .map((a) => a.trim().toLowerCase())
      .filter((a) => a.length > 0);

    if (userAnswers.length === 0) {
      setInputError("Please enter an answer!");
      return;
    }

    setInputError("");

    const correctAnswers = questionData.question.correct_answer.map(a => a.toLowerCase());

    const correct = userAnswers.every(ans => correctAnswers.includes(ans));
    setIsAnsCorrect(correct);
    setAnswered(true);

    const pointsForThisQuestion = correct ? (difficultyMultipliers[sessionData.difficulty] || 1) : 0;
    const isLast = currentQuestionIndex + 1 >= sessionData.quiz_questions.length;

    await supabase
      .from('quiz_questions')
      .update({
        user_answer: userAnswers,
        is_correct: correct,
        answer_time_seconds: Math.floor((Date.now() - shownAt) / 1000)
      })
      .eq('quiz_question_id', questionData.quiz_question_id);

    await supabase.rpc("increment_quiz_session_totals", {
      p_session_id: session_id,
      p_inc_correct: correct ? 1 : 0,
      p_inc_incorrect: correct ? 0 : 1,
      p_add_points: pointsForThisQuestion,
      p_mark_completed: isLast
    });

    goToNextQuestion();
  };

  const goToNextQuestion = () => {
    setTimeout(() => {
      if (currentQuestionIndex + 1 >= sessionData.quiz_questions.length) {
        navigate(`/quiz/${session_id}/results`);
      } else {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    }, 1000);
  };

  if (loading) return <div className='quiz-question-container'>Loading question...</div>;
  if (!sessionData || !questionData) return <div className='quiz-question-container'>No question data.</div>;

  const difficulty = sessionData.difficulty;
  
  return (
    <div className="quiz-question-container">
      <div className='quiz-question-card'>
        <div className='progress-bar-container'>
          <div className='progress-bar-fill' style={{ width: `${((currentQuestionIndex + 1) / sessionData.num_questions) * 100}%` }} />
          <div className='progress-bar-label'>
            {(currentQuestionIndex + 1)} / {sessionData.num_questions}
          </div>
        </div>
        <div className='quiz-header'>
          <div className='header-left'>
            <h2 className='quiz-title'>
              Quiz: <span className='quiz-name'>{sessionData.subcategory.subcategory_name}</span>
            </h2>
          </div>

          <div className='timer'>Time: {timer}s</div>
        </div>

        {questionData.question.question_img ? (
          <img
            src={questionData.question.question_img}
            alt="Question"
            className='question-img'
          />
        ) : questionData.shape ? (
          <div className='question-shape-map'>
            <MapContainer
              style={{
                height: "100%",
                width: "100%",
                borderRadius: "10px",
                backgroundColor: "#f7f6f6ff",
              }}
              center={[0, 0]}
              zoom={3}
              scrollWheelZoom={false}
              doubleClickZoom={false}
              touchZoom={false}
              zoomControl={false}
              attributionControl={true}
              dragging={false}
            >
              <GeoJSON
                data={questionData.shape}
                style={{
                  color: "black",
                  weight: 1,
                  fillColor: "#4d5599",
                  fillOpacity: 1,
                }}
              />
              <FitBounds geoJsonData={questionData.shape} />
            </MapContainer>
          </div>
        ) : null}

        <div className='question-text'>
          {questionData.question.question_text}
        </div>

        <AnimatePresence mode='wait'>
          {difficulty === "hard" ? (
            <motion.div
              key={`input-${currentQuestionIndex}`}
              className={`question-input ${answered ? (isAnsCorrect ? "correct" : "wrong") : ""}`}
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
            >
              <div className='input-column'>
                <div className='input-wrapper'>
                  <input
                    type="text"
                    placeholder='Enter your answer...'
                    ref={inputRef}
                    value={inputAnswer}
                    onChange={(e) => setInputAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleInputSubmit();
                      }
                    }}
                    disabled={answered}
                  />
                  {answered && isAnsCorrect && (
                    <span className='input-correct-icon'>✓</span>
                  )}
                  {answered && !isAnsCorrect && (
                    <span className='input-incorrect-icon'>✗</span>
                  )}
                </div>
                {inputError && (
                  <div className='input-error-msg'>{inputError}</div>
                )}
              </div>
              <button onClick={handleInputSubmit} disabled={answered}>
                Submit
              </button>
            </motion.div>
          ) : (
            <>
              {numCorrectChoices > 1 && (
                <div className='multi-answer-warning'>
                  <FaInfoCircle className='warning-icon' />
                  This question has multiple correct answers. Select all that apply.
                </div>
              )}
              <motion.div
                key={`choices-${currentQuestionIndex}`}
                className={`choices-grid ${difficulty === "easy" ? "grid-2x2" : "grid-2x3"}`}
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
              >
                {choices.map((choice) => (
                  <button
                    key={choice.label}
                    className={`choice-btn ${
                      answered
                        ? (choice.is_correct ? "correct" : selected.includes(choice.label) ? "wrong" : "")
                        : selected.includes(choice.label) ? "selected" : ""
                    }`}
                    onClick={() => handleChoiceClick(choice)}
                    disabled={answered}
                  >
                    <span className='choice-label'>{choice.label}</span> {choice.choice_text}

                    {answered && choice.is_correct && (
                      <span className='choice-icon correct-icon'>✓</span>
                    )}
                    {answered && !choice.is_correct && selected.includes(choice.label) && (
                      <span className='choice-icon incorrect-icon'>✗</span>
                    )}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}