
import {BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import React, { useState } from 'react';
import './App.css'
import AuthPage from './AuthPage';
import MapPage from './MapPage';
import Test from './test';
function App() {
  const [isAuthenticated, setAuthenticated] = useState(false);


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
            {/* <li>
              <Link to="/test">Test</Link>
            </li> */}
          </ul>
        </nav>
        <Routes>
         
          <Route path='/map' element={<MapPage isAuthenticated={isAuthenticated} setAuthenticated={setAuthenticated} />} />
          <Route path='/auth' element={<AuthPage setAuthenticated={setAuthenticated}/>} />
          <Route path='/' element={<Test isAuthenticated={isAuthenticated} />} />
        </Routes>
    
    </Router>
  )
}

export default App
