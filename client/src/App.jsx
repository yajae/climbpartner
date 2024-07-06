
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import React, { useState } from 'react';
import './App.css';
import AuthPage from './AuthPage';
import MapPage from './MapPage';
import Dashboard from './Dashboard';

import logo from './logo.png'; 


function App() {
 
  const [routes, setRoutes] = useState([]);

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
                <Link to="/">登入</Link>
              </li>
              <li>
                <Link to="/dashboard">路線紀錄</Link>
              </li>
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
            <Route path='/' element={<AuthPage  />} />
            <Route path='/auth' element={<AuthPage  />} />
      
            <Route
              path='/dashboard'
              element={
                <Dashboard
                  routes={routes}
                  setRoutes={setRoutes}
                />
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
