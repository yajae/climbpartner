import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import './App.css';
import AuthPage from './AuthPage';
import MapPage from './MapPage';
import Dashboard from './Dashboard';
import axios from 'axios';

import logo from './assets/logo.png'; 

function App() {
  const [routes, setRoutes] = useState([]);
  const [username, setUsername] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get(`${import.meta.env.VITE_SERVER_URL}/api/user`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true
      }).then(response => {
        if (response.data.success) {
          console.log('auth token right')
          setUsername(response.data.username);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      }).catch(() => {
        setIsAuthenticated(false);
      });
    }
  }, [isAuthenticated]);
  const handleLogin = (username, token, userId) => {
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    localStorage.setItem('userId', userId);
    setUsername(username);
    setIsAuthenticated(true);
  };
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    setIsAuthenticated(false);
    setUsername(null);
  };

  return (
    <Router>
      <div className="main-container">
        <header className="header">
          <div className="logo-container">
            <img src={logo} alt="Logo" className="logo" />
          </div>
       
          <nav className="nav-container">
            <ul className="nav-list">
              <li>
                {isAuthenticated ? (
                  <div className="username-container">
                    <span>歡迎, {username}</span>
                    <Link to="/">
                      <button onClick={handleLogout}>登出</button>
                    </Link>
                  </div>
                ) : (
                  <Link to="/auth">
                    <button>登入</button>
                  </Link>
                )}
              </li>
              {isAuthenticated && (
                <li>
                  <Link to="/dashboard">路線紀錄</Link>
                </li>
              )}
            </ul>
          </nav>
    
        </header>
        <main className="content">
          <Routes>
            <Route
              path='/map'
              element={
                <MapPage
                  setRoutes={setRoutes}
                  routes={routes}
                />
              }
            />
            <Route path='/' element={<AuthPage onLogin={handleLogin} />} />
            <Route path='/auth' element={<AuthPage onLogin={handleLogin} />} />
            <Route
              path='/dashboard'
              element={
                isAuthenticated ? (
                  <Dashboard
                    routes={routes}
                    setRoutes={setRoutes}
                  />
                ) : (
                  <Navigate to="/" />
                )
              }
            />
          </Routes>
        </main>
        
        <footer className="footer">
          <p>© 2024 Mountain Climbing Partner. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
