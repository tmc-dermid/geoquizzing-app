import Header from './Header.jsx'
import Footer from './Footer.jsx'
import Home from './pages/Home.jsx'
import Atlas from './pages/Atlas.jsx'
import Categories from './pages/Categories.jsx'
import Quizzes from './pages/Quizzes.jsx'
import News from './pages/News.jsx'
import {Route, Routes } from 'react-router-dom'

function App() {
  return(
    <>
      <Header />
      <div className='container'>
        <Routes>
          <Route path='/' element={ <Home /> } />
          <Route path='/atlas' element={ <Atlas /> } />
          <Route path='/categories' element={ <Categories /> } />
          <Route path='/quizzes' element={ <Quizzes /> } />
          <Route path='/news' element={ <News /> } />
        </Routes>
      </div>
      <Footer />
    </>
  );
}

export default App