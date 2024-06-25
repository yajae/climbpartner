import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
const AuthPage = ({ setAuthenticated }) => {
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
    // const response = await fetch(`http://localhost:3000${url}`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({ username, password }),
    //   credentials: 'include'
    // });
    const response = await fetch(`${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password }),
      credentials: 'include'
    });
    const data = await response.json();
    if (data.success) {
      setAuthenticated(true);
      localStorage.setItem('userId', data.userId);

      navigate('/dashboard', { state: { userId: data.userId } });
    } else {
      alert('Login fail');
    }

  };

 
  return (
    <div>
      <form onSubmit={handleSubmit}>
        <h2>{isLogin ? '登入' : '註冊'}</h2>
        <div>
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">{isLogin ? '登入' : '註冊'}</button>
      </form>
      <button onClick={toggleAuthMode}>
        {isLogin ? '切換到註冊' : '切換到登入'}
      </button>
    </div>
  );
};

export default AuthPage;
