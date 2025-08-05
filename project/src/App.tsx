import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import ChatPage from './components/ChatPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {isAuthenticated ? <ChatPage /> : <LoginPage />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;