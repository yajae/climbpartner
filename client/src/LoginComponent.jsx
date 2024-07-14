import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const LoginComponent = ({ onLogin, toggleAuthMode }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password }),
      credentials: 'include'
    });
    const data = await response.json();
    if (data.success) {
      onLogin(data.userName, data.token, data.userId);
  
      navigate('/dashboard');
      console.log('success login',data)
    } else {
      setMessage('Login failed');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>登入</h2>
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
        <button type="submit" className="submit-button">登入</button>
           {message && <p className="message">{message}</p>}
      </form>
      <button onClick={toggleAuthMode} className="toggle-button">切換到註冊</button>
   
    </motion.div>
  );
};

export default LoginComponent;
