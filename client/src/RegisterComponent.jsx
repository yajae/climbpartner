import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const RegisterComponent = ({ toggleAuthMode }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
  };

  const handleUsernameChange = async (e) => {
    const value = e.target.value;
    setUsername(value);
    if (value) {
      try {
        const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/check-username`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username: value })
        });
        const data = await response.json();
        setUsernameAvailable(data.available);
        setErrors((prevErrors) => ({ ...prevErrors, username: data.available ? '' : 'Username is already taken' }));
      } catch (error) {
        console.error('Error checking username availability:', error);
      }
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    const passwordError = validatePassword(value) ? '' : 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character';
    setErrors((prevErrors) => ({ ...prevErrors, password: passwordError }));
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    const emailError = validateEmail(value) ? '' : 'Invalid email format';
    setErrors((prevErrors) => ({ ...prevErrors, email: emailError }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!username) newErrors.username = 'Username is required';
    if (!usernameAvailable) newErrors.username = 'Username is already taken';
    if (!validateEmail(email)) newErrors.email = 'Invalid email format';
    // if (!validatePassword(password)) newErrors.password = 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) {
      setMessage('Please fix the errors in the form');
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
      setMessage('Registration failed: ' + data.message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>註冊</h2>
        <div className="input-group">
          <label>使用者名稱</label>
          <input
            type="text"
            value={username}
            onChange={handleUsernameChange}
            required
          />
          {errors.username && <p className="error">{errors.username}</p>}
        </div>
        <div className="input-group">
          <label>電子郵件</label>
          <input
            type="email"
            value={email}
            onChange={handleEmailChange}
            required
          />
          {errors.email && <p className="error">{errors.email}</p>}
        </div>
        <div className="input-group">
          <label>密碼</label>
          <input
            type="password"
            value={password}
            onChange={handlePasswordChange}
            required
          />
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
