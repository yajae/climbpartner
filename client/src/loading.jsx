import React from 'react';
import './loading.css'; 

const Loading = () => {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>加載中...</p>
    </div>
  );
};

export default Loading;
