// File: src/App.jsx
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import React, { useState } from 'react';
import './App.css';
import AuthPage from './AuthPage';
import MapPage from './MapPage';
import Test from './test';
import Dashboard from './Dashboard';
import RoutePlanner from './RoutePlanner';

function App() {
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [routes, setRoutes] = useState([]);

  return (
    <Router>
      <nav className="container">
        <ul className="nav-list">
          <li>
            <Link to="/">Test</Link>
          </li>
          <li>
            <Link to="/map">Map</Link>
          </li>
          <li>
            <Link to="/auth">Auth</Link>
          </li>
          <li>
            <Link to="/dashboard">Dashboard</Link>
          </li>
          <li>
            <Link to="/routeplanner">RoutePlanner</Link>
          </li>
        </ul>
      </nav>
      <Routes>
        <Route
          path='/map'
          element={
            <MapPage
              isAuthenticated={isAuthenticated}
              setAuthenticated={setAuthenticated}
              setRoutes={setRoutes}
              routes={routes}
            />
          }
        />
        <Route path='/auth' element={<AuthPage setAuthenticated={setAuthenticated} />} />
        <Route path='/' element={<Test isAuthenticated={isAuthenticated} />} />
        <Route
          path='/dashboard'
          element={
            <Dashboard
              routes={routes}
              setRoutes={setRoutes}
            />
          }
        />
        <Route
          path='/routeplanner'
          element={
            <RoutePlanner
              setRoutes={setRoutes}
              routes={routes}
            />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
