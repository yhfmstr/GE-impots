import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Home from './pages/Home';
import ChatPage from './pages/ChatPage';
import DocumentsPage from './pages/DocumentsPage';
import ResultsPage from './pages/ResultsPage';
import GuidePage from './pages/GuidePage';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/declaration" element={<GuidePage />} />
            <Route path="/guide" element={<Navigate to="/declaration" replace />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/results" element={<ResultsPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
