import { AuthProvider } from './context/AuthProvider.jsx';
import { AuthContext } from './context/AuthContext.jsx';
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
import History from './pages/History.jsx';
import Favorites from './pages/Favorites.jsx';
import UserProfile from './pages/UserProfile.jsx';
import EditProfile from './pages/EditProfile.jsx';
import Achievements from './pages/Achievements.jsx';
import AchievementsAdmin from './pages/admin/AchievementsAdmin.jsx';
import Quiz from './pages/Quiz.jsx';
import QuizQuestion from './pages/QuizQuestion.jsx';
import QuizResults from './pages/QuizResults.jsx';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import 'leaflet/dist/leaflet.css';
import './styles/App.less';


function AppRoutes({ profile }) {
  const location = useLocation();

  return (
    <AnimatePresence mode='wait'>
      <Routes location={location} key={location.pathname}>
        <Route path='/' element={ <Home /> } />
        <Route path='/atlas' element={ <Atlas /> } />
        <Route path='/categories' element={ <Categories /> } />
        <Route path='/categories/:categoryId' element={ <Quizzes /> } />
        <Route path='/quiz/:slug' element={ <Quiz /> } />  
        <Route path='/quiz/:session_id/:question_order' element={ <QuizQuestion /> } />   
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
        <Route path='/history' element={ <History username={profile?.username} /> } />
        <Route
          path='/admin/achievements'
          element={
            !profile ? (
              <p>Loading...</p>
            ) : profile.is_admin ? (
              <AchievementsAdmin />
            ) : (
              <Navigate to='/' replace />
            )
          }
        />
      </Routes>
    //</AnimatePresence>
  );
}


function App() {
  return(
    <AuthProvider>
      <AuthContext.Consumer>
        {({ profile }) => (
          <div className='app-wrapper'>
            <Header />
            <div className='container'>
              <AppRoutes profile={profile} />
            </div>
            <Footer />
          </div>
        )}
      </AuthContext.Consumer>
    </AuthProvider>
  );
}

export default App;