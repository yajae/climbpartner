import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './AuthPage.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const url = isLogin ? '/login' : '/register';
    const response = await fetch(`/api${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password }),
      credentials: 'include'
    });
    const data = await response.json();
    if (data.success) {

      localStorage.setItem('userId', data.userId);
      navigate('/dashboard', { state: { userId: data.userId } });
    } else {
      alert('Login failed');
    }
  };

  return (
    <div className="auth-page">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <form onSubmit={handleSubmit} className="auth-form">
          <h2>{isLogin ? '登入' : '註冊'}</h2>
          <div className="input-group">
            <label>使用者名稱</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>密碼</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="submit-button">
            {isLogin ? '登入' : '註冊'}
          </button>
        </form>
        <button onClick={toggleAuthMode} className="toggle-button">
          {isLogin ? '切換到註冊' : '切換到登入'}
        </button>
      </motion.div>
    </div>
  );
};

export default AuthPage;