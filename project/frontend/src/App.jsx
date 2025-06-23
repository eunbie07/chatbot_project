import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ChatDetailPage from './pages/ChatDetailPage';
import DiaryDetailPage from './pages/DiaryDetailPage';
import BudgetPage from './pages/BudgetPage';
import LoginPage from './pages/LoginPage';
import Navbar from './components/Navbar';
import { UserProvider } from './contexts/UserContext.jsx';
import AnalysisPage from './pages/BudgetPageA.jsx';

function App() {
  return (
    <UserProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat" element={<ChatDetailPage />} />
          <Route path="/diary" element={<DiaryDetailPage />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/budgetA" element={<AnalysisPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
