import React from 'react';

const RouteInfo = () => {
  const handleSaveRoute = () => {
    const routeName = document.getElementById('route-name').value;
    const newRoute = {
      name: routeName,
      markers: markers.map(marker => marker.getLngLat().toArray()),
    };
    setRoutes([route, newRoute]);
    navigate('/dashboard');
  };

  return (
    <div className="form-container">
      <div>
        <label htmlFor="route-name">路線名稱</label>
        <input type="text" id="route-name" placeholder="輸入路線名稱" />
      </div>
      <div>
        <label htmlFor="start-date">開始日期</label>
        <input type="date" id="start-date" />
      </div>
      <button onClick={handleSaveRoute}>保存路線</button>
      <div id="day-1">
        <div>第1天</div>
        <div id="walking-time"></div>
        <div id="walking-distance"></div>
        <div id="total-ascent"></div>
        <div id="total-descent"></div>
      </div>
    </div>
  );
};

export default RouteInfo;
