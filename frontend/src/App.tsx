import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { BrowsePage } from './pages/BrowsePage';
import { AgentDetailPage } from './pages/AgentDetailPage';
import { CategoryPage } from './pages/CategoryPage';
import { SubmitPage } from './pages/SubmitPage';
import { GetFeaturedPage } from './pages/GetFeaturedPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ErrorPage } from './pages/ErrorPage';
import { LoginPage, AdminShell } from './pages/AdminConsole';
import { useState, useEffect } from 'react';

function ConsoleWrapper() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const t = localStorage.getItem('admin_token');
    const u = localStorage.getItem('admin_user');
    if (t && u) {
      setToken(t);
      try { setUser(JSON.parse(u)); } catch { setUser(null); }
    }
  }, []);

  const login = (t: string, u: any) => {
    localStorage.setItem('admin_token', t);
    localStorage.setItem('admin_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setToken(null);
    setUser(null);
  };

  if (!token || !user) return <LoginPage onLogin={login} />;
  return <AdminShell user={user} token={token} onLogout={logout} />;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout><HomePage /></Layout>} />
      <Route path="/browse" element={<Layout><BrowsePage /></Layout>} />
      <Route path="/agents/:slug" element={<Layout><AgentDetailPage /></Layout>} />
      <Route path="/categories/:slug" element={<Layout><CategoryPage /></Layout>} />
      <Route path="/submit" element={<Layout><SubmitPage /></Layout>} />
      <Route path="/featured" element={<GetFeaturedPage />} />
      <Route path="/console/*" element={<ConsoleWrapper />} />
      <Route path="/error" element={<ErrorPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
