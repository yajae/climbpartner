// RoutePlanner.js
import React from 'react';
import { Link } from 'react-router-dom';
import './RoutePlanner.css';  // 引入CSS文件

const RoutePlanner = () => {
  return (
    <div className="route-planner-container">
      <h1>Route Planner</h1>
      <Link to="/map">Go to Map</Link>
    </div>
  );
};

export default RoutePlanner;
