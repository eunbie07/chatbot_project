// Layout.jsx
import { Link } from 'react-router-dom';

const Layout = ({ left, center, right }) => {
  return (
    <div style={{
      backgroundColor: '#f0f2ff',
      minHeight: '100vh',
      fontFamily: '"Apple SD Gothic Neo", sans-serif',
      width: '100%',
      margin: 0,
      padding: 0,
      overflowX: 'hidden'
    }}>
      
      {/* ✅ 상단 내비게이션 바 */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        padding: '20px 40px',
        backgroundColor: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '50px' }}>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#6C63FF', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/chatbot_main.png" alt="리마인봇 로고" style={{ height: '80px', verticalAlign: 'middle' }} />
          </div>
          <ul style={{ display: 'flex', gap: '30px', listStyle: 'none', margin: 0, padding: 0 }}>
            <li>
              <Link to="/" style={{ textDecoration: 'none', fontSize: '20px', color: '#666' }}>Home</Link>
            </li>
            <li>
              <a
                href="https://oddly-proven-swan.ngrok-free.app/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none', fontSize: '20px', color: '#666' }}
              >
                Analysis
              </a>
            </li>
            <li>
              <Link to="/chat" style={{ textDecoration: 'none', fontSize: '20px', color: '#666' }}>Chat</Link>
            </li>
            <li>
              <Link to="/diary" style={{ textDecoration: 'none', fontSize: '20px', color: '#666' }}>Diary</Link>
            </li>
            <li>
              <Link to="/budget" style={{ textDecoration: 'none', fontSize: '20px', color: '#666' }}>Budget</Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* ✅ 3단 레이아웃 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 2fr 1fr',
        gap: '20px',
        padding: '30px'
      }}>
        <div>{left}</div>
        <div>{center}</div>
        <div>{right}</div>
      </div>
    </div>
  );
};

export default Layout;
