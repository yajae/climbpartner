import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Tabs from './Tabs';
import ChatWidget from './ChatWidget';
import MapComponent from './MapComponent';
import ElevationProfile from './ElevationProfile';
import RouteInfo from './RouteInfo';
import './MapPage.css';

const MapPage = ({ isAuthenticated, setAuthenticated }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const routeId = queryParams.get('routeId') || 1;
  const userId = localStorage.getItem('userId');
  const room = `${routeId}`;
  const [activeTab, setActiveTab] = useState(0);
  const tabs = [
    { label: '路線規劃' },
    { label: '聊天室' },
    { label: '即時天氣預測' }
  ];
  const [isChartVisible, setIsChartVisible] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [routes, setRoutes] = useState([]);
  
  const toggleChartVisibility = () => {
    setIsChartVisible(!isChartVisible);
  };

  return (
    <div className="map-page">
      <div id='tab-box'>
        <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="tab-content">
          {activeTab === 0 && (
            <div id="other-info">
              <RouteInfo markers={markers} setRoutes={setRoutes} />
            </div>
          )}
          {activeTab === 1 && (
            <div className='chat-widget-container'>
              <ChatWidget room={room} />
            </div>
          )}
          {activeTab === 2 && (
            <div>
              <ElevationProfile isChartVisible={isChartVisible} />
            </div>
          )}
        </div>
      </div>
      <div id="main-info">
        <MapComponent
          isAuthenticated={isAuthenticated}
          setAuthenticated={setAuthenticated}
          userId={userId}
          routeId={routeId}
          room={room}
        />
        <div>
          <button id='toggle-elvation-button' onClick={toggleChartVisibility}>
            {isChartVisible ? '隱藏海拔剖面圖' : '顯示海拔剖面圖'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
