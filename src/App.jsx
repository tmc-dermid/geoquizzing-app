import { Route, Routes, useLocation } from 'react-router-dom';
import { useEffect, useContext, useRef } from 'react';
import { AuthContext } from './context/AuthContext.jsx';
import { AnimatePresence } from 'framer-motion';
import { startActivity, updateActivity, endActivity } from './activity/activityApi.js';
import { ToastContainer } from 'react-toastify';
import { AchievementToastContainer } from './helper/AchievementToastContainer.jsx';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import Home from './pages/Home.jsx';
import Atlas from './pages/Atlas.jsx';
import Categories from './pages/Categories.jsx';
import Quizzes from './pages/Quizzes.jsx';
import SignUp from './pages/SignUp.jsx';
import SignIn from './pages/SignIn.jsx';
import Profile from './pages/Profile.jsx';
import Statistics from './pages/Statistics.jsx';
import Favorites from './pages/Favorites.jsx';
import UserProfile from './pages/UserProfile.jsx';
import EditProfile from './pages/EditProfile.jsx';
import Achievements from './pages/Achievements.jsx';
import Quiz from './pages/Quiz.jsx';
import QuizQuestion from './pages/QuizQuestion.jsx';
import QuizResults from './pages/QuizResults.jsx';
import QuizHistory from './pages/QuizHistory.jsx';
import SignOutModal from './pages/SignOutModal.jsx';

import AdminRoute from './routes/AdminRoute.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AchievementsAdmin from './pages/admin/AchievementsAdmin.jsx';
import NewsAdmin from './pages/admin/NewsAdmin.jsx';


import 'react-toastify/dist/ReactToastify.css';
import 'leaflet/dist/leaflet.css';
import './styles/App.less';


function App() {
  const { profile } = useContext(AuthContext);
  const location = useLocation();
  const sessionActive = useRef(false);

  useEffect(() => {
    if (!profile?.id) return;

    const start = async () => {
      await startActivity(profile.id);
      sessionActive.current = true;
    };

    start();

    const interval = setInterval(() => {
      if (sessionActive.current) updateActivity();
    }, 30000);

    const handleBeforeUnload = async () => {
      if (sessionActive.current) {
        await endActivity();
        sessionActive.current = false;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id) return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        if (sessionActive.current) {
          await endActivity();
          sessionActive.current = false;
        }
      } else {
        if (!sessionActive.current) {
          await startActivity(profile.id);
          sessionActive.current = true;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [profile?.id]);


  return (
    <div className='app-wrapper'>
      <AchievementToastContainer />
      <Header />
      <SignOutModal />
      <div className='container'>
        <AnimatePresence mode='wait'>
          <Routes location={location} key={location.pathname}>
            <Route path='/' element={ <Home /> } />
            <Route path='/atlas' element={ <Atlas /> } />
            <Route path='/categories' element={ <Categories /> } />
            <Route path='/categories/:categoryId' element={ <Quizzes /> } />
            <Route path='/quiz-menu/:slug' element={ <Quiz /> } />  
            <Route path='/quiz/:session_id' element={ <QuizQuestion /> } />
            <Route path='/quiz/:session_id/results' element={ <QuizResults/> } />   
            <Route path='/quizzes' element={ <Quizzes /> } />
            <Route path='/signup' element={ <SignUp /> } />
            <Route path='/signin' element={ <SignIn /> } />
            <Route path='/profile' element={ <Profile /> } />
            <Route path='/profile/edit' element={ <EditProfile /> } />
            <Route path='/user/:username' element={ <UserProfile /> } />
            <Route path='/statistics' element={ <Statistics username={profile?.username} /> } />
            <Route path='/achievements' element={ <Achievements username={profile?.username} /> } />
            <Route path='/favorites' element={ <Favorites username={profile?.username} /> } />
            <Route path='/history' element={ <QuizHistory username={profile?.username} /> } />

            <Route
              path='/admin'
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path='/admin/achievements'
              element={
                <AdminRoute>
                  <AchievementsAdmin />
                </AdminRoute>
              }
            />
            <Route
              path='/admin/news'
              element={
                <AdminRoute>
                  <NewsAdmin />
                </AdminRoute>
              }
            />
          </Routes>
        </AnimatePresence>
      </div>
      
      <Footer />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

export default App;