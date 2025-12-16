import { useState, useEffect, useMemo, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import supabase from '../helper/supabaseClient.js';
import '../styles/QuizHistory.less';


export default function QuizHistory({ username }) {

  const [sessions, setSessions] = useState([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [ownerId, setOwnerId] = useState(null);

  const { user } = useContext(AuthContext);

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchOwnerId() {
      if (!username) return;

      if (user?.id && username === user.user_metadata?.username) {
        setOwnerId(user.id);
        return;
      }

      const { data: profile, error } = await supabase
        .from('user_profile')
        .select('id')
        .eq('username', username)
        .single();
        
      if (!error && profile) {
        setOwnerId(profile.id);
      } else {
        console.error("Error fetching user profile:", error);
      }
    }

    fetchOwnerId();
  }, [username, user]);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);

      const { data: profileData, error: profileError } = await supabase
        .from('user_profile')
        .select('id')
        .eq('username', username)
        .single();

      if (profileError || !profileData) {
        console.error("Failed to load user profile:", profileError);
        setSessions([]);
        setLoading(false);
        return;
      }

      const { data: quizSessions, error: quizSessionsErr } = await supabase
        .from('quiz_sessions')
        .select(`
          session_id,
          difficulty,
          total_correct,
          num_questions,
          total_points,
          time_taken_seconds,
          completed_at,
          subcategories(
            subcategory_name,
            subcategory_img,
            categories(
              category_name
            )
          )
        `)
        .eq('user_id', profileData.id)
        .order('completed_at', { ascending: false });

      if (quizSessionsErr) {
        console.error("Error fetching quiz history:", quizSessionsErr);
        setSessions([]);
      } else {
        setSessions(quizSessions);
      }

      setLoading(false);
    }

    fetchHistory();
  }, [username]);
  
  const handleClickSession = (sessionId) => {
    navigate(`/quiz/${sessionId}/results`);
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...sessions];

    if (difficultyFilter !== "all") {
      result = result.filter((s) => s.difficulty === difficultyFilter);
    }

    if (categoryFilter !== "all") {
      result = result.filter((s) => s.subcategories.categories.category_name === categoryFilter);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.completed_at) - new Date(a.completed_at);

        case "oldest":
          return new Date(a.completed_at) - new Date(b.completed_at);

        case "highest_points":
          return b.total_points - a.total_points;

        case "shortest_time":
          return a.time_taken_seconds - b.time_taken_seconds;

        case "longest_time":
          return b.time_taken_seconds - a.time_taken_seconds;

        default:
          return 0;
      }
    });

    return result;
  }, [sessions, sortBy, difficultyFilter, categoryFilter]);

  if (loading) return <p className='loading-info'>Loading quiz history...</p>;
  if (!sessions.length) return (
    <div className="quiz-history-container">
      <p className="no-quiz-history">{isOwner ? "You haven't played any quizzes yet" : <span><strong>{username}</strong> hasn't played any quizzes yet</span>}</p>
    </div>
  );

  const uniqueCategories = [...new Set(
    sessions.map(s => s.subcategories.categories.category_name)
  )];

  const isOwner = user?.id && ownerId && user.id === ownerId;

  const formatDate = (date) => new Date(date).toLocaleDateString("en-GB", {
    day: "numeric", 
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <div className="quiz-history-container">
      <h2 className='quiz-history-heading'>
        {isOwner ? "Your Quiz History" : <span><strong>{username}'s</strong> Quiz History</span>}
      </h2>
      <div className='filters-panel'>
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
        >
          <option value="all">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          {uniqueCategories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="newest">Newest → Oldest</option>
          <option value="oldest">Oldest → Newest</option>
          <option value="highest_points">Highest Points</option>
          <option value="shortest_time">Shortest Time</option>
          <option value="longest_time">Longest Time</option>
        </select>
      </div>

      {!loading && (
        <p className='results-count'>
          {isOwner
            ? <>You&apos;ve played a total of <strong>{sessions.length}</strong> quiz{sessions.length !== 1 ? "zes" : ""}</>
            : <><strong>{username}</strong> has played <strong>{sessions.length}</strong> quiz{sessions.length !== 1 ? "zes" : ""}</>
          }
        </p>
      )}
      <AnimatePresence>
        {filteredAndSorted.slice(0, visibleCount).map((session) => (
          <motion.div
            key={session.session_id}
            className='quiz-card'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            onClick={() => handleClickSession(session.session_id)}
          >
            <div className='quiz-card-left'>
              {session.subcategories.subcategory_img ? (
                <img
                  src={session.subcategories.subcategory_img}
                  alt={session.subcategories.subcategory_name}
                />
              ) : (
                <div className='placeholder-img' />
              )}
            </div>

            <div className='quiz-card-center'>
              <h4 className='quiz-name'>{session.subcategories.subcategory_name}</h4>
              <p className='quiz-completed-date'>
                {formatDate(session.completed_at)}
              </p>
            </div>

            <div className='quiz-card-middle'>
              <p className={`quiz-difficulty diff-${session.difficulty}`}>
                {session.difficulty}
              </p>
            </div>

            <div className='quiz-card-right'>
              <div className='info-box quiz-score'>
                Score: {session.total_correct} / {session.num_questions}
              </div>
              <div className='info-box quiz-time'>
                Time: {session.time_taken_seconds}s
              </div>
              <div className='info-box quiz-points'>
                Points: {session.total_points}
              </div>
            </div>
          </motion.div>
        ))}

        {visibleCount < filteredAndSorted.length && (
          <div
            className='show-more'
            onClick={() => setVisibleCount(prev => prev + 10)}
          >
            Show More
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}