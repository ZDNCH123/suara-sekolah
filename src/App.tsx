import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { DataProvider } from './contexts/DataContext';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import SpeakUpCorner from './pages/SpeakUpCorner';
import NewsPortal from './pages/NewsPortal';
import ChatPage from './pages/ChatPage';
import AdminDashboard from './pages/AdminDashboard';
import ProfilePage from './pages/ProfilePage';
import LoadingScreen from './components/UI/LoadingScreen';
import { NotificationProvider } from './contexts/NotificationContext';

function AppRouter() {
  const { user, loading } = useAuth();
  const [appLoading, setAppLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (appLoading || loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/speak-up" element={<SpeakUpCorner />} />
        <Route path="/news" element={<NewsPortal />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        {user.role === 'admin' && (
          <Route path="/admin" element={<AdminDashboard />} />
        )}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <DataProvider>
            <Router>
              <div className="App">
                <AppRouter />
              </div>
            </Router>
          </DataProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;