// src/components/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import chatbotLogo from '../../public/chatbot_main.png';
import '../styles/Navbar.css';

const nameMap = {
  soyeon123: '김소연',
  eunwoo123: '차은우',
  minseok123: '박민석'
};

const Navbar = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  // ✅ user가 존재할 때만 displayName 생성
  const displayName = user?.username
    ? `${nameMap[user.username] || user.username} 님`
    : '';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-left-group">
        <Link to="/" className="logo">
          <img src={chatbotLogo} alt="로고" className="logo-image" />
        </Link>
        <div className="navbar-center">
          <a href="https://bass-worthy-actively.ngrok-free.app">Home</a>
          <a href="https://bass-worthy-actively.ngrok-free.app/analysis">Analysis</a>
          <Link to="/chat">Chat</Link>
          <Link to="/diary">Diary</Link>
          <Link to="/budgetA">Budget</Link>
        </div>
      </div>

      <div className="navbar-right">
        <a
          href="https://preferably-united-wren.ngrok-free.app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <button className="fetch-btn">금융 데이터 가져오기</button>
        </a>
        {user ? (
          <>
            <span className="welcome-text">{displayName}</span>
            <button className="auth-btn" onClick={handleLogout}>로그아웃</button>
          </>
        ) : (
          <Link to="/login" className="auth-link">로그인</Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
