import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import ChatPage from './pages/ChatPage';
import DeclarationPage from './pages/DeclarationPage';
import DocumentsPage from './pages/DocumentsPage';
import ResultsPage from './pages/ResultsPage';
import GuidePage from './pages/GuidePage';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/declaration" element={<DeclarationPage />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
