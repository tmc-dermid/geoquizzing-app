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

  const { session_id, question_order } = useParams();
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
  const [shownAt, setShownAt] = useState(Date.now());
  const [isAnsCorrect, setIsAnsCorrect] = useState(null);
  const [numCorrectChoices, setNumCorrectChoices] = useState(1);

  const difficultyMultipliers = {
    easy: 2,
    medium: 3,
    hard: 5
  };

  useEffect(() => {
    setAnswered(false);
    setSelected([]);
    setIsAnsCorrect(null);

    if (questionData) {
      setShownAt(Date.now());
    }
  }, [question_order]);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);

      const { data: sessionRes, error: sessionError } = await supabase
        .from('quiz_sessions')
        .select(`
          session_id,
          subcategory_id,
          difficulty,
          num_questions,
          with_dependencies,
          total_correct,
          total_incorrect,
          base_points,
          hint_penalty,
          completed_at,
          status,
          started_at,
          subcategory:subcategories (
            subcategory_name,
            category:categories (
              category_name
            )
          )
        `)
        .eq('session_id', session_id)
        .single();

      if (sessionError || !sessionRes) {
        console.error("Session not found", sessionError);
        return;
      }

      setSessionData(sessionRes);

      const { data: questionRow, error: questionError } = await supabase
        .from('quiz_questions')
        .select(`
          quiz_question_id,
          question_id,
          question_order,
          correct_answer,
          user_answer,
          attempts,
          is_hint_used,
          question:questions(
            question_text,
            question_img,
            question_id,
            country_id,
            correct_answer
          )
        `)
        .eq('session_id', session_id)
        .eq('question_order', question_order)
        .single();
      
      if (questionError || !questionRow) {
        console.error("Question not found", questionError);
        return;
      }

      const { data: choicesData, error: choicesError } = await supabase.rpc("get_question_dynamic_choices", {
        p_question_id: questionRow.question.question_id,
        p_subcategory_id: sessionRes.subcategory_id,
        p_difficulty: sessionRes.difficulty,
        p_include_dependencies: sessionRes.with_dependencies
      });

      if (choicesError) {
        console.error("Error fetching choices:", choicesError);
        return;
      }

      let shuffledChoices = [...(choicesData || [])].sort(() => Math.random() - 0.5);

      const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
      shuffledChoices = shuffledChoices.map((choice, index) => ({
        ...choice,
        label: labels[index]
      }));

      let shapeData = null;

      if (
        sessionRes.subcategory?.category?.category_name === "Country Shapes" &&
        !questionRow.question.question_img &&
        questionRow.question.country_id
      ) {
        const { data: shapeRes, error: shapeError } = await supabase
          .from('country_shapes')
          .select('geom')
          .eq('country_id', questionRow.question.country_id)
          .single();
        
        if (!shapeError && shapeRes) {
          shapeData = shapeRes.geom;
        }
      }

      setQuestionData({
        ...questionRow,
        shape: shapeData
      });
      setChoices(shuffledChoices);
      setLoading(false);

      const correctCount = shuffledChoices.filter(c => c.is_correct).length;
      setNumCorrectChoices(correctCount);
    };

    fetchQuestions();
  }, [session_id, question_order]);


  useEffect(() => {
    if (!sessionData) return;

    const start = new Date(sessionData.started_at).getTime();

    setTimer(Math.max(0, Math.floor((Date.now() - start) / 1000)));

    const interval = setInterval(() => {
      setTimer(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionData]);

  
  useEffect(() => {
    if (!questionData) return;

    if (sessionData?.difficulty === "hard" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [questionData, sessionData]);


  const handleChoiceClick = async (choice) => {
    if (answered) return;

    let updatedSelected = [...selected];

    if (updatedSelected.includes(choice.label)) {
      updatedSelected = updatedSelected.filter(l => l !== choice.label);
    } else {
      updatedSelected.push(choice.label);
    }

    setSelected(updatedSelected);

    const selectedChoices = choices.filter(c => updatedSelected.includes(c.label));
    const isLast = parseInt(question_order) >= sessionData.num_questions;
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

    const correctAnswers = questionData.question.correct_answer.map((a) => a.toLowerCase());

    const correct = userAnswers.every(ans => correctAnswers.includes(ans));
    setIsAnsCorrect(correct);
    setAnswered(true);

    const pointsForThisQuestion = correct ? (difficultyMultipliers[sessionData.difficulty] || 1) : 0;
    const isLast = parseInt(question_order) >= sessionData.num_questions;

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
      if (parseInt(question_order) >= sessionData.num_questions) {
        navigate(`/quiz/${session_id}/results`);
      } else {
        navigate(`/quiz/${session_id}/${parseInt(question_order) + 1}`);
      }
    }, 1000);
  };

  if (loading || !sessionData || !questionData) return <div className='quiz-question-container'>Loading question...</div>;

  const difficulty = sessionData.difficulty;
  
  return (
    <div className="quiz-question-container">
      <div className='quiz-question-card'>
        <div className='quiz-header'>
          <div className='header-left'>
            <h2 className='quiz-title'>
              Quiz: <span className='quiz-name'>{sessionData.subcategory.subcategory_name}</span>
            </h2>
            <div className='question-counter'>
              Question {question_order} / {sessionData.num_questions}
            </div>
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
              scrollWheelZoom={true}
              zoomControl={true}
              attributionControl={true}
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
              key={`input-${question_order}`}
              className={`question-input ${answered ? (isAnsCorrect ? "correct" : "wrong") : ""}`}
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
            >
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
                key={`choices-${question_order}`}
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