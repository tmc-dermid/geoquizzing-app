import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { GiTrophyCup } from "react-icons/gi";
import { FiImage, FiArrowUp, FiArrowLeft, FiMap } from 'react-icons/fi';
import { FaRegLightbulb } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import CountryShapeSvg from './CountryShapeSvg.jsx';
import CountUp from 'react-countup';
import supabase from '../helper/supabaseClient.js';
import '../styles/QuizResults.less';


export default function QuizResults() {

  const { session_id } = useParams();
  const navigate = useNavigate();
  const questionsSectionRef = useRef(null);

  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);
  const [modalImg, setModalImg] = useState(null);

  useEffect(() => {
    const fetchSessionData = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('quiz_sessions')
        .select(`
          *,
          quiz_questions:quiz_questions (
            quiz_question_id,
            user_answer,
            correct_answer,
            is_correct,
            is_hint_used,
            hints_used,
            answer_time_seconds,
            question:questions (
              question_text,
              question_img,
              country_id
            )
          ),
          subcategories:subcategories (
            subcategory_name,
            categories:category_id (
              category_name
            )
          )
        `)
        .eq('session_id', session_id)
        .single();

      if (error) {
        console.error('Error fetching session data:', error);
        setLoading(false);
        return;
      }

      setSessionData(data);
      setLoading(false);
    };

    fetchSessionData();
  }, [session_id]);


  const fetchCountryShape = async (country_id) => {
    const { data, error } = await supabase
      .from('country_shapes')
      .select('geom')
      .eq('country_id', country_id)
      .single();

    if (error) {
      console.error("Error fetching country shape:", error);
      return;
    }

    return data.geom;
  };


  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && modalImg) {
        setModalImg(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalImg]);


  useEffect(() => {
    if (!sessionData) return;
    if (!session_id) return;

    const completeQuiz = async () => {
      const { data: rpcData, error: rpcError } = await supabase.rpc('update_user_stats', {
        p_session_id: sessionData.session_id
      });

      if (rpcError) {
        console.error("Error updating stats:", rpcError);
      } else {
        console.log("Stats updated successfully:", rpcData);
      }
    };

    completeQuiz();
  }, [sessionData, session_id]);


  if (loading) return <div className='quiz-results-container'><i>Loading...</i></div>;
  if (!sessionData) return <div className='quiz-results-container'><i>No session data found.</i></div>;


  const formatTime = (seconds) => {
    if (!seconds) return '0s';

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins}m ${secs}s`;
  };


  const realTime = sessionData.quiz_questions?.reduce(
    (sum, q) => sum + (q.answer_time_seconds || 0), 0
  );

  const isCountryShapesCategory = sessionData?.subcategories?.categories?.category_name === "Country Shapes";


  return (
    <div className="quiz-results-container">
      <div className='quiz-results-header'>
        <button
          className='back-btn'
          onClick={() => navigate("/quizzes")}
          title="Back to Quizzes"
        >
          <FiArrowLeft />
        </button>
        <GiTrophyCup className='header-icon left' />
        <div className='header-center'>
          Quiz Completed!
          <span className='quiz-name'>{sessionData.subcategories?.subcategory_name}</span>
        </div>
        <GiTrophyCup className='header-icon right' />
      </div>

      <div className='quiz-results-summary'>
        <div className='score-box'>
          <div className='score-title'>
            Overall Score
          </div>
          <div className='score-big'>
            <CountUp
              start={0}
              end={sessionData.total_correct}
              duration={1.5}
            />
            {" / "}{sessionData.num_questions}
          </div>
          <div className='score-sub'>
            <CountUp
              start={0}
              end={Math.round((sessionData.total_correct / sessionData.num_questions) * 100)}
              duration={1.5}
            />
            %
          </div>
        </div>
      </div>

      <div className='results-grid'>
        <div className='results-item'>
          <span className='results-label'>Time</span>
          <div className='times'>
            <div className='time-row'>
              <span className='time-label'>Total:</span>
              <span className='time-value'>{formatTime(sessionData.time_taken_seconds)}</span>
            </div>

            <div className='time-row'>
              <span className='time-label'>Real:</span>
              <span className='time-value'>{formatTime(realTime)}</span>
            </div>
          </div>
        </div>

        <div className="results-item total-points">
          <span className="results-label">Total Points</span>

          <div className='penalty-points'>
            <span className="results-value">
              <CountUp
                start={0}
                end={sessionData.total_points}  
                duration={1.5}
              />
            </span>

            {sessionData.hint_penalty > 0 && (
              <span className='penalty-text' title={`${sessionData.hint_penalty} points were deducted for hints`}>
                (-{sessionData.hint_penalty} pts)
              </span>
            )}
          </div>
        </div>

        <div className="results-item">
          <span className="results-label">Average Time</span>
          <span className="results-value">{(realTime / sessionData.num_questions).toFixed(1)}s</span>
        </div>
      </div>

      <div className='extra-stats'>
        <div className="stats-item">
          <span className="stats-label">Difficulty</span>
          <span className="stats-value">{sessionData.difficulty}</span>
        </div>
        <div className="stats-item">
          <span className="stats-label">Total Incorrect</span>
          <span className="stats-value">{sessionData.total_incorrect}</span>
        </div>
        <div className="stats-item">
          <span className='stats-label'>Hints Used</span>
          <span className='stats-value'>
            <CountUp
              start={0}
              end={sessionData.used_hints_count}  
              duration={1.5}
            />
          </span>
        </div>
        <div className="stats-item">
          <span className="stats-label">Mode</span>
          <span className="stats-value">{sessionData.with_dependencies ? "With dependencies" : "Standard"}</span>
        </div>
      </div>


      <div className='questions-section'>
        <div
          className='questions-toggle'
          onClick={() => {
            if (showDetails) {
              questionsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            setShowDetails(prev => !prev);
          }}
        >
          {showDetails ? 'Hide Details' : 'Show Question Details'}
        </div>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              className='questions-list'
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {sessionData.quiz_questions.slice(0, visibleCount).map((q, index) => (
                <div
                  key={q.quiz_question_id}
                  className={`question-card ${q.is_correct ? 'correct' : 'incorrect'}`}
                >
                  <div className='question-content'>
                    <div className='question-top'>
                      <span className='question-number'>Q{index + 1}</span>
                      <div className='icons-right'>
                        {q.is_hint_used && (
                          <FaRegLightbulb
                            className='hint-icon'
                            title='Hint used'
                          />
                        )}
                        <span className={`result-icon ${q.is_correct ? "corr" : "incorr"}`}>
                          {q.is_correct ? '✓' : '✗'}
                        </span>
                      </div>
                    </div>
                    <span className='question-text'>
                      {q.question.question_text}{" "}
                      {q.question.question_img && (
                        <FiImage
                          className='img-icon'
                          title="View Image"
                          onClick={() => setModalImg({
                            type: 'image',
                            src: q.question.question_img
                          })}
                        />
                      )}

                      {isCountryShapesCategory && q.question.country_id && (
                        <FiMap
                          className='img-icon country-shape'
                          title="View Country Shape"
                          onClick={async () => {
                            let geom = q.question.country?.country_shapes?.[0]?.geom;

                            if (!geom) {
                              geom = await fetchCountryShape(q.question.country_id);
                            }

                            if (geom) {
                              setModalImg({
                                type: 'svg',
                                geojson: geom
                              });
                            }
                          }}
                        />
                      )}
                    </span>

                    <div className='answers-row'>
                      <div className='answer-block'>
                        <span className='answer-label'>Your Answer:</span>
                        <span className='answer-value'>
                          {q.user_answer?.length ? q.user_answer.join(", ") : "-"}
                        </span>
                      </div>

                      <div className='answer-block'>
                        <span className='answer-label'>Correct Answer:</span>
                        <span className='answer-value correct-answer'>
                          {q.correct_answer.join(", ")}
                        </span>
                      </div>

                      <div className='answer-block'>
                        <span className='answer-label'>Time Taken:</span>
                        <span className='answer-value'>
                          {q.answer_time_seconds}s
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {visibleCount < sessionData.quiz_questions.length && (
                <div
                  className='show-more'
                  onClick={() => setVisibleCount(prev => prev + 10)}
                >
                  Show More
                </div>
              )}
              <button
                className='scroll-top-btn'
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                title="Scroll to Top"
              >
                <FiArrowUp size={24} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {modalImg && (
          <motion.div
            className='img-modal-overlay'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModalImg(null)}
          >
            {modalImg.type === 'image' && (
              <motion.img
                className='img-modal-content'
                src={modalImg.src}
                alt="Question"
                initial={{ scale: 0.75, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.75, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeIn" }}
                onClick={(e) => e.stopPropagation()}
              />
            )}

            {modalImg.type === 'svg' && (
              <motion.div
                style={{
                  backgroundColor: "#f7f6f6",
                  borderRadius: "10px",
                }}
                initial={{ scale: 0.75, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.75, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeIn" }}
                onClick={(e) => e.stopPropagation()}
              >
                <CountryShapeSvg
                  geojson={modalImg.geojson}
                  width={modalImg.width}
                  height={modalImg.height}
                />
              </motion.div>
            )}

            <button className='img-modal-close-btn' onClick={() => setModalImg(null)}>×</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}