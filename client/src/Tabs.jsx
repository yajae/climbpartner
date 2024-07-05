import React, { useState } from 'react';

const Tabs = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div className="tabs">
    {tabs.map((tab, index) => (
      <React.Fragment key={index}>
        <button
          className={`tab-button ${activeTab === index ? 'active' : ''}`}
          onClick={() => setActiveTab(index)}
        >
          {tab.label}
        </button>
        {index < tabs.length - 1 && <div className="divider"></div>}
      </React.Fragment>
    ))}
  </div>
  );
};

export default Tabs;
