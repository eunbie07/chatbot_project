import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const Navbar = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '20px 40px',
      backgroundColor: '#fff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      marginBottom: '20px'
    }}>
      {/* 왼쪽: 로고와 메뉴 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '50px' }}>
        <div style={{ 
          fontSize: '22px', 
          fontWeight: 'bold', 
          color: '#6C63FF', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px' 
        }}>
          <img 
            src="/chatbot_main.png" 
            alt="리마인봇 로고" 
            style={{ height: '80px', verticalAlign: 'middle' }} 
          />
        </div>
        
        <ul style={{ 
          display: 'flex', 
          gap: '30px', 
          listStyle: 'none', 
          margin: 0, 
          padding: 0 
        }}>
          <li>
            <Link to="/" style={{ 
              textDecoration: 'none', 
              fontSize: '20px', 
              color: '#666' 
            }}>
              Home
            </Link>
          </li>
          <li>
            <span
              onClick={() => window.location.href = 'https://preferably-united-wren.ngrok-free.app/'}
              style={{ 
                cursor: 'pointer', 
                fontSize: '20px', 
                color: '#666', 
                textDecoration: 'none' 
              }}
            >
              Analysis
            </span>
          </li>
          <li>
            <Link to="/chat" style={{ 
              textDecoration: 'none', 
              fontSize: '20px', 
              color: '#666' 
            }}>
              Chat
            </Link>
          </li>
          <li>
            <Link to="/diary" style={{ 
              textDecoration: 'none', 
              fontSize: '20px', 
              color: '#666' 
            }}>
              Diary
            </Link>
          </li>
          <li>
            <Link to="/budget" style={{ 
              textDecoration: 'none', 
              fontSize: '20px', 
              color: '#666' 
            }}>
              Budget
            </Link>
          </li>
          <li>
            <Link to="/budgetA" style={{ 
              textDecoration: 'none', 
              fontSize: '20px', 
              color: '#666' 
            }}>
              Budget
            </Link>
          </li>
        </ul>
      </div>

      {/* 오른쪽: 사용자 정보와 로그아웃 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {user ? (
          <>
            <span style={{ 
              fontSize: '16px', 
              color: '#666',
              fontWeight: '500'
            }}>
              안녕하세요, {user.username}님!
            </span>
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: '#6C63FF',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#5A52D5'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#6C63FF'}
            >
              로그아웃
            </button>
          </>
        ) : (
          <Link 
            to="/login"
            style={{
              backgroundColor: '#6C63FF',
              color: 'white',
              textDecoration: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'background-color 0.2s'
            }}
          >
            로그인
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;