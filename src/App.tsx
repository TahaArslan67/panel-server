import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import Login from './Login';
import Dashboard from './components/Dashboard';

const theme = createTheme();

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('token');
  });

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      console.log('Token durumu:', !!token);
      setIsAuthenticated(!!token);
    };

    // İlk yüklemede kontrol et
    checkAuth();

    // Event listener'ları ekle
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  console.log('Current auth state:', isAuthenticated); // Debug için

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Routes>
          <Route 
            path="/" 
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
          />
          <Route 
            path="/dashboard" 
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/notifications" 
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/profile" 
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/settings" 
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/" replace />} 
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;