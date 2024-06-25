import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Dashboard.css';  
import axios from 'axios';
import PermissionModal from './PermissionModal'; 
import Cookies from 'js-cookie';

const Dashboard = ({ routes, setRoutes }) => {

 
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const userIdnumber =  localStorage.getItem('userId');
  const [userId, setUserId] = useState(userIdnumber);
  const id = localStorage.getItem('userId');
  
  useEffect(() => {
    // if (location.state && location.state.userId) {
     
      console.log('localStorage.getItem', localStorage.getItem('userId'));
      setUserId(id);
    // } else {
    //   const id = Cookies.get('userId'); // 从Local Storage中读取
    //   console.log('User ID from local storage:', id); // 检查是否读取正确
    //   setUserId(id);
    // }
    const fetchRoutes = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/user-paths/${id}`);
        setRoutes(response.data);
      } catch (error) {
        console.error('Error fetching user routes', error);
      }
    };

    fetchRoutes();
  }, [location.state]);

  // useEffect(() => {
  //   const fetchRoutes = async () => {
  //     try {
  //       const response = await axios.get(`http://localhost:3000/api/user-paths/${userId}`);
  //       setRoutes(response.data);
  //     } catch (error) {
  //       console.error('Error fetching user routes', error);
  //     }
  //   };

  //   fetchRoutes();
  // }, [ setRoutes]);

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

  return (
    <div className="dashboard-container">
      <h1>My Dashboard</h1>
      
      {routes.length === 0 ? (
        <p>No routes available. Add a new route to get started.</p>
      ) : (
        <ul>
          {routes.map((route, index) => (
            <li key={index}>
              {route.name || '路線名稱'}{' 日期'}
              <button onClick={() => handleUpdateRoute(route)}>更新路線</button>
              
              <span>權限: {getPermissionLabel(route.permissions.type)}</span>
              <button onClick={() => handleOpenModal(route)}>設定權限</button>
            </li>
          ))}
        </ul>
      )}
      <div className='container'>
        <button>
          <Link to="/map" style={{ color: 'white', textDecoration: 'none' }}>新增路線</Link>
        </button>
      </div>
    
      {isModalOpen && (
        <PermissionModal 
          route={selectedRoute} 
          onClose={handleCloseModal} 
          onPermissionsChange={updateRoutePermissions} // Pass the update function as prop
        />
      )}

    </div>
  );
};

export default Dashboard;
