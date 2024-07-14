import React, { useState } from 'react';
import LoginComponent from './LoginComponent';
import RegisterComponent from './RegisterComponent';
import './AuthPage.css';

const AuthPage = ({onLogin}) => {
  const [isLogin, setIsLogin] = useState(false);

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="auth-page">
      {isLogin ? (
        <LoginComponent onLogin={onLogin}  toggleAuthMode={toggleAuthMode} />
      ) : (
        <RegisterComponent onLogin={onLogin} toggleAuthMode={toggleAuthMode} />
      )}
    </div>
  );
};

export default AuthPage;
