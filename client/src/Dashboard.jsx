import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Dashboard.css';  
import axios from 'axios';
import PermissionModal from './PermissionModal'; 
import Loading from './loading';

const Dashboard = () => {
  const [username, setUsername] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
 
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const userIdnumber =  localStorage.getItem('userId');
  const [userId, setUserId] = useState(userIdnumber);
  const id = localStorage.getItem('userId');
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get(`${import.meta.env.VITE_SERVER_URL}/api/user`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true
      }).then(response => {
        if (response.data.success) {
          console.log('auth token right')
          setUsername(response.data.username);
          setIsAuthenticated(true);
        }      
         setLoading(false); 
      }).catch(() => {
        setIsAuthenticated(false);
        setLoading(false); 
      });
    } else {
      setLoading(false); 
    }
  }, []);
  useEffect(() => {
    console.log('localStorage.getItem', localStorage.getItem('userId'));
    setUserId(id);

    const fetchRoutes = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/route/user-paths/${id}`);
        setRoutes(response.data);
        console.log('route',response.data)
      } catch (error) {
        console.error('Error fetching user routes', error);
      }
      setLoading(false);
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
      const response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/route/create-route`, {
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

  
  if (loading) {
    return <Loading />;
  }

  return (
    <div className="dashboard-container">
      <h1>我的路線</h1>
      
      {(!routes || routes.length === 0) ? (
        <p>目前沒有路線，請新增路線。</p>
      ) : (
        <ul>
          {routes.map((route, index) => (
            <li key={index}>
              <div className="route-info">
                <div>路線名稱:  {route.routeName || '路線名稱'}</div>
                <div>日期:  {route.date || '2024/7/10'}</div>
                <div>權限:  {getPermissionLabel(route.permissions.type)}</div>
              </div>
              <div className="buttons">
                <button onClick={() => handleUpdateRoute(route)}>路線細節</button>
                <button onClick={() => handleOpenModal(route)}>設定權限</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className='container'>
        <button onClick={handleCreateNewRoute} id='add-route-btn'>
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
