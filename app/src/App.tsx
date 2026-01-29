import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import LandingPage from './pages/LandingPage';
import ChessPage from './pages/ChessPage';
import XiangqiPage from './pages/XiangqiPage';
import GoPage from './pages/GoPage';
import TutorialPage from './pages/TutorialPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="chess" element={<ChessPage />} />
          <Route path="xiangqi" element={<XiangqiPage />} />
          <Route path="go" element={<GoPage />} />
          <Route path="tutorial" element={<TutorialPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
