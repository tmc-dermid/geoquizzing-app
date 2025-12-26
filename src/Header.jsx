import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { PiSignOutBold, PiUserBold, PiChartBarBold, PiHeartBold, PiClockBold, PiTrophyBold } from 'react-icons/pi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './context/useAuth.js';
import logo from './assets/logo.png';


export default function Header() {

  const location = useLocation();
  const dropdownRef = useRef();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, profile, signOut } = useAuth();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setDropdownOpen(false);

    await signOut();
  };

  return (   
    <header className='header-container'>
      <div className='logo'>
        <NavLink to="/"><img src={logo} alt="Logo"/></NavLink>
      </div>
      <ul className='nav-links'>
        <li className={isActive("/atlas")}>
          <NavLink to="/atlas">Atlas</NavLink>
        </li>
        <li className={isActive("/categories")}>
          <NavLink to="/categories">Categories</NavLink>
        </li>
        <li className={isActive("/quizzes")}>
          <NavLink to="/quizzes">All Quizzes</NavLink>
        </li>

        {!user && (
          <>
            <li className={`sign-button ${isActive("/signup")}`}>
              <NavLink to="/signup">Sign Up</NavLink>
            </li>
            <li className={`sign-button ${isActive("/signin")}`}>
              <NavLink to="/signin">Sign In</NavLink>
            </li>
          </>
        )}

        {user && profile && (
          <li className='user-avatar' ref={dropdownRef}>
            <div className='avatar-wrapper' onClick={() => setDropdownOpen(!dropdownOpen)}>
              <img
                src={profile.avatar_url}
                alt='Avatar'
                title={profile.username}
                className='avatar'
              />
            </div>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  className='dropdown'
                  initial={{ opacity: 0, scale: 0.98, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -5 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <div className='user-info'>
                    <img
                      src={profile.avatar_url}
                      alt='Avatar'
                      title={profile.username}
                      className='avatar'
                    />
                    <span className='username'>{profile.username}</span>
                  </div>
                  <hr/>
                  <NavLink to='/profile' className='dropdown-link'>
                    <PiUserBold className='icon' />
                    Profile
                  </NavLink>
                  <NavLink to ='/profile?tab=statistics' className='dropdown-link'>
                    <PiChartBarBold className='icon' />
                    Statistics
                  </NavLink>
                  <NavLink to ='/profile?tab=achievements' className='dropdown-link'>
                    <PiTrophyBold className='icon' />
                    Achievements
                  </NavLink>
                  <NavLink to='/profile?tab=favorites' className='dropdown-link'>
                    <PiHeartBold className='icon' />
                    Favorites
                  </NavLink>
                  <NavLink to ='/profile?tab=history' className='dropdown-link'>
                    <PiClockBold className='icon' />
                    History
                  </NavLink>
                  <hr />
                  <button onClick={handleSignOut}>
                    <PiSignOutBold className='signout-icon'/>
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        )}
      </ul>
    </header>
  );
}
