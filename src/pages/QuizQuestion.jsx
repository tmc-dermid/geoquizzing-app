import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import supabase from '../helper/supabaseClient.js';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/QuizQuestion.less';

export default function QuizQuestion() {

  const { session_id, question_order } = useParams();
  const navigate = useNavigate();

  const [sessionData, setSessionData] = useState(null);
  const [questionData, setQuestionData] = useState(null);
  const [choices, setChoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [answered, setAnswered] = useState(false);
  const [timer, setTimer] = useState(0);
  const [inputAnswer, setInputAnswer] = useState("");
  const [shownAt, setShownAt] = useState(Date.now());

  useEffect(() => {
    setShownAt(Date.now());
    setAnswered(false);
    setSelected([]);
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
          started_at,
          subcategory:subcategories(
            subcategory_name
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

      console.log("sessionRes.with_dependencies", sessionRes.with_dependencies);

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

      setQuestionData(questionRow);
      setChoices(shuffledChoices);
      setLoading(false);
    };

    fetchQuestions();
  }, [session_id, question_order]);


  useEffect(() => {
    if (!sessionData) return;

    const interval = setInterval(() => {
        const now = Date.now();
        const start = new Date(sessionData.started_at).getTime();
        setTimer(Math.floor((now - start) / 1000));
      }, 1000);
    
    return () => clearInterval(interval);
  }, [sessionData]);


  const handleChoiceClick = async (choice) => {
    if (answered) return;

    const isCorrect = choice.is_correct;
    const userAnswerArray = [choice.choice_text];

    setSelected([choice.label]);
    setAnswered(true);

    await supabase
      .from('quiz_questions')
      .update({
        user_answer: userAnswerArray,
        is_correct: isCorrect,
        answer_time_seconds: Math.floor((Date.now() - shownAt) / 1000)
      })
      .eq('quiz_question_id', questionData.quiz_question_id);

    goToNextQuestion();
  };


  const handleInputSubmit = async () => {
    if (answered) return;

    const userAnswers = inputAnswer
      .split(",")
      .map((a) => a.trim().toLowerCase())
      .filter((a) => a.length > 0);

    const correctAnswers = questionData.question.correct_answer.map((a) => a.toLowerCase());

    const isCorrect = 
      userAnswers.length === correctAnswers.length &&
      userAnswers.every((ans) => correctAnswers.includes(ans));

    setAnswered(true);

    await supabase
      .from('quiz_questions')
      .update({
        user_answer: userAnswers,
        is_correct: isCorrect,
        answer_time_seconds: Math.floor((Date.now() - shownAt) / 1000)
      })
      .eq('quiz_question_id', questionData.quiz_question_id);

    goToNextQuestion();
  };

  const goToNextQuestion = () => {
    setTimeout(() => {
      if (parseInt(question_order) >= sessionData.num_questions) {
        navigate(`/quiz/${session_id}/results`);
      } else {
        navigate(`/quiz/${session_id}/${parseInt(question_order) + 1}`);
      }
    }, 2000);
  };

  if (loading || !sessionData || !questionData) return <div className='quiz-question-container'>Loading question...</div>;

  const difficulty = sessionData.difficulty;
  
  return (
    <div className="quiz-question-container">
      <div className='quiz-question-card'>
        <div className='quiz-header'>
          <div className='header-left'>
            <h2>Quiz: {sessionData.subcategory.subcategory_name}</h2>
            <div className='question-counter'>
              Question {question_order} / {sessionData.num_questions}
            </div>
          </div>

          <div className='timer'>Time: {timer}s</div>
        </div>

        {questionData.question.question_img && (
          <img
            src={questionData.question.question_img}
            alt="Question"
            className='question-img'
          />
        )}

        <div className='question-text'>
          {questionData.question.question_text}
        </div>

        <AnimatePresence mode='wait'>
          {difficulty === "hard" ? (
            <motion.div
              key={`input-${question_order}`}
              className='question-input'
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
            >
              <input
                type="text"
                placeholder='Enter your answer...'
                value={inputAnswer}
                onChange={(e) => setInputAnswer(e.target.value)}
                disabled={answered}
              />
              <button onClick={handleInputSubmit} disabled={answered}>
                Submit
              </button>
            </motion.div>
          ) : (
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
                    answered ? choice.is_correct ? "correct" : selected.includes(choice.label) ? "wrong" : "" : ""
                  }`}
                  onClick={() => handleChoiceClick(choice)}
                  disabled={answered}
                >
                  <span className='choice-label'>{choice.label}</span> {choice.choice_text}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}