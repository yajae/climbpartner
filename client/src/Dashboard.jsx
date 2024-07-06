import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Dashboard.css';  
import axios from 'axios';
import PermissionModal from './PermissionModal'; 


const Dashboard = () => {

  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const userIdnumber =  localStorage.getItem('userId');
  const [userId, setUserId] = useState(userIdnumber);
  const id = localStorage.getItem('userId');
  const [routes, setRoutes] = useState([]);
  useEffect(() => {
    console.log('localStorage.getItem', localStorage.getItem('userId'));
    setUserId(id);

    const fetchRoutes = async () => {
      try {
        const response = await axios.get(`/route/user-paths/${id}`);
        setRoutes(response.data);
        console.log('route',response.data)
      } catch (error) {
        console.error('Error fetching user routes', error);
      }
    };

    fetchRoutes();
  }, [location.state]);

  const handleOpenModal = (route) => {
    setSelectedRoute(route);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedRoute(null);
    setIsModalOpen(false);
  };

  const handleUpdateRoute = (route) => {
    console.log('route', route)
    navigate(`/map?routeId=${route._id}`, { state: {  route } });
  };

  const updateRoutePermissions = (routeId, newPermissions) => {
    setRoutes(prevRoutes => prevRoutes.map(route => 
      route.routeId === routeId ? { ...route, permissions: newPermissions } : route
    ));
  };

  const getPermissionLabel = (permission) => {
    switch (permission) {
      case 'private':
        return '僅限個人編輯';
      case 'friends':
        return '允許指定好友編輯';
      case 'public':
        return '允許公開編輯';
      default:
        return '';
    }
  };

  const handleCreateNewRoute = async () => {
    try {
      const response = await axios.post('http://localhost:3000/route/create-route', {
        userId,
        routeName: '新路線'
      });
      console.log(response.data.routeId)
      const newRouteId = response.data.routeId;
      
      if(newRouteId){
        navigate(`/map?routeId=${newRouteId}`);
      }
      console.log('no newRouteid')
      
    } catch (error) {
      console.error('Error creating new route', error);
    }
  };

  return (
    <div className="dashboard-container">
      <h1>我的路線</h1>
      
      {routes.length === 0 ? (
        <p>No routes available. Add a new route to get started.</p>
      ) : (
        <ul>
          {routes.map((route, index) => (
            <li key={index}>
              <div className="route-info">
                <div>路線名稱:  {route.routeName || '路線名稱'}</div>
                <div>日期:  {route.date || '日期'}</div>
                <div>權限:  {getPermissionLabel(route.permissions.type)}</div>
              </div>
              <div className="buttons">
                <button onClick={() => handleUpdateRoute(route)}>更新路線</button>
                <button onClick={() => handleOpenModal(route)}>設定權限</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className='container'>
        <button onClick={handleCreateNewRoute}>
          新增路線
        </button>
      </div>
    
      {isModalOpen && (
        <PermissionModal 
          route={selectedRoute} 
          onClose={handleCloseModal} 
          onPermissionsChange={updateRoutePermissions} 
        />
      )}
    </div>
  );
};

export default Dashboard;
