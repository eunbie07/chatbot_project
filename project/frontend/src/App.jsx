// App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ChatDetailPage from './pages/ChatDetailPage';
import DiaryDetailPage from './pages/DiaryDetailPage';
// import AnalysisPage from './pages/AnalysisPage'; // ❌ 외부 페이지로 이동하므로 import 필요 없음
import BudgetPage from './pages/BudgetPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chat" element={<ChatDetailPage />} />
        <Route path="/diary" element={<DiaryDetailPage />} />
        {/* <Route path="/analysis" element={<AnalysisPage />} /> */} {/* ❌ 외부로 이동하므로 제거 */}
        <Route path="/budget" element={<BudgetPage />} />
      </Routes>
    </Router>
  );
}

export default App;
