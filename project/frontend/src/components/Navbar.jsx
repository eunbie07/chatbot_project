import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';  // ✅ Context 사용

export default function Navbar() {
  const { user, setUser } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('username');
    navigate('/');
  };

  return (
    <nav style={{
      borderBoxSizing: 'border-box',
      display: 'flex',
      justifyContent: 'space-between',   // ✅ 사용자 정보 우측 정렬
      alignItems: 'center',
      padding: '20px 40px',
      backgroundColor: '#fff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '50px' }}>
        <div style={{
          fontSize: '22px',
          fontWeight: 'bold',
          color: '#6C63FF',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <img src="/chatbot_main.png" alt="리마인봇 로고" style={{ height: '80px', verticalAlign: 'middle' }} />
        </div>
        <ul style={{ display: 'flex', gap: '30px', listStyle: 'none', margin: 0, padding: 0 }}>
          <li><Link to="/" style={linkStyle}>Home</Link></li>
          <li>
            <span
              onClick={() => window.location.href = 'https://preferably-united-wren.ngrok-free.app/'}
              style={{ ...linkStyle, cursor: 'pointer' }}
            >
              Analysis
            </span>
          </li>
          <li><Link to="/chat" style={linkStyle}>Chat</Link></li>
          <li><Link to="/diary" style={linkStyle}>Diary</Link></li>
          <li><Link to="/budget" style={linkStyle}>Budget</Link></li>
        </ul>
      </div>

      {/* 👤 사용자 정보 표시 영역 */}
      <div>
        {user ? (
          <>
            <span style={{ marginRight: '16px', color: '#333', fontWeight: '500' }}>
              👋 {user.username}
            </span>
            <button
              onClick={handleLogout}
              style={{
                padding: '6px 12px',
                backgroundColor: '#eee',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              로그아웃
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '6px 12px',
              backgroundColor: '#6C63FF',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            로그인
          </button>
        )}
      </div>
    </nav>
  );
}

const linkStyle = {
  textDecoration: 'none',
  fontSize: '20px',
  color: '#666',
};
