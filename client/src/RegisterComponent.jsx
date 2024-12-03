import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const RegisterComponent = ({ toggleAuthMode }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateForm = () => {
    const newErrors = {};
    if (!username) newErrors.username = '必須填寫使用者名稱';
    if (!validateEmail(email)) newErrors.email = '電子郵件格式不正確';
    if (password.length < 8) newErrors.password = '密碼至少要 8 個字元';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) {
      setMessage('請修正表單中的錯誤');
      return;
    }
    const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password, email }),
      credentials: 'include'
    });
    const data = await response.json();
    if (data.success) {
      localStorage.setItem('userId', data.userId);
      navigate('/dashboard', { state: { userId: data.userId } });
    } else {
      setMessage('註冊失敗: ' + data.message);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>註冊</h2>
        <div className="input-group">
          <label>使用者名稱</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
          {errors.username && <p className="error">{errors.username}</p>}
        </div>
        <div className="input-group">
          <label>電子郵件</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {errors.email && <p className="error">{errors.email}</p>}
        </div>
        <div className="input-group">
          <label>密碼</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {errors.password && <p className="error">{errors.password}</p>}
        </div>
        <button type="submit" className="submit-button">註冊</button>
      </form>
      <button onClick={toggleAuthMode} className="toggle-button">切換到登入</button>
      {message && <p className="message">{message}</p>}
    </motion.div>
  );
};

export default RegisterComponent;
