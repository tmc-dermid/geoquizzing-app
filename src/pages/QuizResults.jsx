import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import CountUp from 'react-countup';
import supabase from '../helper/supabaseClient.js';
import { FaRegClock, FaStar, FaQuestion } from "react-icons/fa6";
import '../styles/QuizResults.less';

export default function QuizResults() {

  const { session_id } = useParams();
  const navigate = useNavigate();

  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessionData = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('quiz_sessions')
        .select(`
          *,
          subcategory:subcategories (
            subcategory_name
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

  if (loading) return <div className='quiz-results-container'>Loading...</div>;
  if (!sessionData) return <div className='quiz-results-container'>No session data found.</div>;

  const formatTime = (seconds) => {
    if (!seconds) return '0s';

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins}m ${secs}s`;
  };

  return (
    <div className="quiz-results-container">
      <div className='quiz-results-header'>
        Quiz Completed!
        <span className='quiz-name'>{sessionData.subcategory?.subcategory_name}</span>
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
          <div className='result-icon'>
            <FaRegClock />
          </div>
          <span className='results-label'>Time</span>
          <span className='results-value'>{formatTime(sessionData.time_taken_seconds)}</span>
        </div>

        <div className="results-item total-points">
          <div className="result-icon">
            <FaStar />
          </div>
          <span className="results-label">Total Points</span>
          <span className="results-value">
            <CountUp
              start={0}
              end={sessionData.total_points}  
              duration={1.5}
            />
          </span>
        </div>

        <div className="results-item">
          <div className='result-icon'>
            <FaQuestion />
          </div>
          <span className="results-label">Hints Used</span>
          <span className="results-value">
            <CountUp
              start={0}
              end={sessionData.used_hints_count}  
              duration={1.5}
            />
            </span>
        </div>
      </div>

      <div className='extra-stats'>
        <div className="stats-item">
          <div className="stats-label">Difficulty</div>
          <div className="stats-value">{sessionData.difficulty}</div>
        </div>
        <div className="stats-item">
          <div className="stats-label">Average Time</div>
          <div className="stats-value">{(sessionData.time_taken_seconds / sessionData.num_questions).toFixed(1)}s</div>
        </div>
        <div className="stats-item">
          <div className="stats-label">Total Incorrect</div>
          <div className="stats-value">{sessionData.total_incorrect}</div>
        </div>
        <div className="stats-item">
          <div className="stats-label">Mode</div>
          <div className="stats-value">{sessionData.with_dependencies ? "With dependencies" : "Standard"}</div>
        </div>
      </div>
    </div>
  );
}