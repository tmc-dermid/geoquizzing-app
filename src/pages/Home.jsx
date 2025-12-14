import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from "react-countup";
import supabase from '../helper/supabaseClient';
import '../styles/Home.less';

export default function Home() {
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [popularQuizzes, setPopularQuizzes] = useState([]);
  const [popularLoading, setPopularLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [appStatsLoading, setAppStatsLoading] = useState(true);
  const [appStats, setAppStats] = useState({
    total_users: 0,
    quizzes_completed: 0,
    questions_answered: 0,
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadNews();
    loadPopularQuizzes();
    loadStats();
  }, []);

  useEffect(() => {
    async function fetchUser() {
      const { data, error } = await supabase.auth.getUser();

      if (!error) setUser(data.user);
    }

    fetchUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener?.subscription.unsubscribe();
  }, []);


  async function loadNews() {
    setNewsLoading(true);

    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) {
      console.error("Error loading nwes:", error);
      setNewsLoading(false);
      return;
    }

    setNews(data || []);
    setNewsLoading(false);
  }

  async function loadPopularQuizzes() {
    setPopularLoading(true);

    const { data, error } = await supabase
      .from('quiz_sessions')
      .select(`
        subcategory_id,
        subcategories (
          subcategory_id,
          subcategory_name,
          subcategory_img,
          slug
        )
      `)
      .eq('status', 'completed');

    if (error) {
      console.error("Error loading popular quizzes:", error);
      setPopularLoading(false);
      return;
    }

    const counts = {};

    data.forEach((row) => {
      const id = row.subcategory_id;
      counts[id] = counts[id] ? counts[id] + 1 : 1;
    });

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => data.find((row) => row.subcategory_id === Number(id)).subcategories);

    setPopularQuizzes(sorted);
    setPopularLoading(false);
  }

  async function loadStats() {
    setAppStatsLoading(true);
    
    try {
      const { count: userCount, error: userErr } = await supabase
        .from('user_profile')
        .select('*', { count: 'exact', head: true });

      if (userErr) throw userErr;

      const { count: quizCount, error: quizErr } = await supabase
        .from('quiz_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      if (quizErr) throw quizErr;

      const { count: answerCount , error: answerErr } = await supabase
        .from('quiz_questions')
        .select('quiz_question_id', { count: 'exact', head: true })
        .not('user_answer', 'is', null);

      if (answerErr) throw answerErr;

      setAppStats({
        total_users: userCount || 0,
        quizzes_completed: quizCount || 0,
        questions_answered: answerCount,
      });

    } catch (err) {
      console.error("Error loading stats:", err)
    } finally {
      setAppStatsLoading(false);
    }
  }

  async function playRandomQuiz() {
    try {
      const { data: subcategoriesData, error } = await supabase
        .from('subcategories')
        .select('*');

      if (error) {
        console.error("Error fetching subcategories:", error);
        return;
      }

      const randomIndex = Math.floor(Math.random() * subcategoriesData.length);
      const randomQuizId = subcategoriesData[randomIndex];

      navigate(`/quiz-menu/${randomQuizId.slug}`);
    } catch (err) {
      console.error(err);
    }
  }

  const formatDate = (date) => new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <motion.div
      className='home-page'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <section className='home-hero'>
        <h1>
          {user ? `Welcome back, ${user.user_metadata?.username}!` : "Welcome back!"}
        </h1>
        <p>Test your geography knowledge, earn achievements and track your progress.</p>
        <div className='hero-actions'>
          <button className='primary-btn' onClick={() => navigate('/quizzes')}>
            Browse Quizzes
          </button>
          <button className='secondary-btn' onClick={playRandomQuiz}>
            Play Random Quiz
          </button>
        </div>
      </section>

      <div className='home-layout'>
        <main className='home-main'>
          <section className='home-section'>
            <h2 className='section-title'>What's new</h2>
            <motion.div
              className='news-list'
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: {
                  transition: { staggerChildren: 0.15 }
                }
              }}
            >
              {newsLoading ? (
                <p>Loading...</p>
              ) : (
                news.map((n) => (
                  <motion.div
                    className='news-card'
                    key={n.news_id}
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
                    }}
                  >
                    {n.image_url && (
                      <div className='news-image'>
                        <img src={n.image_url} alt={n.title} />
                      </div>
                    )}

                    <div className='news-content'>
                      <h4 className='news-title'>{n.title}</h4>
                      <p className="news-date">{formatDate(n.created_at)}</p>
                      <p className="news-description">{n.description}</p>
                      {n.examples && (
                      <div className="news-examples">
                        <span>Examples:</span>
                        <ul>
                          {n.examples.split(';').map((example, index) => (
                            <li key={index}>{example}</li>
                          ))}
                        </ul>
                      </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          </section>

          <section className='home-section'>
            <h2 className='section-title'>Popular quizzes</h2>
            <div className='quiz-grid'>
              {popularLoading ? (
                <p>Loading...</p>
              ) : (
                popularQuizzes.map((q) => (
                  <div
                    className='result-card'
                    key={q.subcategory_id}
                    onClick={() => navigate(`/quiz-menu/${q.slug}`)}
                  >
                    <img
                      src={q.subcategory_img}
                      alt={q.subcategory_name}
                      loading='lazy'
                      className='result-img'
                    />
                    <div className='result-name'>
                      <p>{q.subcategory_name}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>

        <aside className='home-aside'>
          <h3 className='aside-title'>General Stats</h3>

          <div className='stats-list'>
            <div className="stat-card">
              <span className='stat-value'>
                {appStatsLoading ? '...' : <CountUp end={appStats.total_users} duration={1.5} />}
              </span>
              <span className='stat-label'>Users</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">
                {appStatsLoading ? '...' : <CountUp end={appStats.quizzes_completed} duration={1.5} />}
              </span>
              <span className="stat-label">Quizzes Completed</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">
                {appStatsLoading ? '...' : <CountUp end={appStats.questions_answered} duration={1.5} />}
              </span>
              <span className="stat-label">Questions Answered</span>
            </div>
          </div>
        </aside>
      </div>
    </motion.div>
  );
}
