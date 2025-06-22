import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

function LoginPage() {
  const { setUser } = useUser();
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    if (username.trim()) {
      setUser({ username });
      localStorage.setItem('username', username.trim());
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">로그인</h2>

        <input
          type="text"
          placeholder="아이디 입력"
          className="border border-gray-300 rounded px-4 py-2 w-full mb-4"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="bg-indigo-600 text-white px-4 py-2 rounded w-full hover:bg-indigo-700 transition"
        >
          로그인
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
