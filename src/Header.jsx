import logoImg from './assets/geo-logo.png'
import { NavLink, useLocation } from 'react-router-dom'
import React from 'react';

export default function Header() {

    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path ? 'active' : '';
    };

    return(
        <header className='header-container'>
            <div className='logo'>
                <img src={logoImg} alt="Logo"></img>
                <NavLink to="/" className='logo-name'>GeoQuizzing</NavLink>
            </div>
            <ul className='nav-links'>
                <li className={isActive("/atlas")}>
                    <NavLink to="/atlas">Atlas</NavLink>
                </li>
                <li className={isActive("/categories")}>
                    <NavLink to="/categories">Categories</NavLink>
                </li>
                <li className={isActive("/quizzes")}>
                    <NavLink to="/quizzes">Quizzes</NavLink>
                </li>
                <li className={isActive("/news")}>
                    <NavLink to="/news">News</NavLink>
                </li>
            </ul>
        </header>
    );
}
