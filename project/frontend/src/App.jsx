import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ChatDetailPage from './pages/ChatDetailPage';
import DiaryDetailPage from './pages/DiaryDetailPage';
// import AnalysisPage from './pages/AnalysisPage';
import BudgetPage from './pages/BudgetPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chat" element={<ChatDetailPage />} />
        <Route path="/diary" element={<DiaryDetailPage />} />
        {/* <Route path="/Analysis" element={<AnalysisPage />} /> */}
        <Route path="/budget" element={<BudgetPage />} />
      </Routes>
    </Router>
  );
}

export default App;
