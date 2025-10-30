import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { AUTH_CONFIG } from './utils/config';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import NetworkStatus from './components/NetworkStatus';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Board from './pages/Board';
import Members from './pages/Members';
import Teams from './pages/Teams';
import Holidays from './pages/Holidays';
import LeaveSettings from './pages/LeaveSettings';
import Leaves from './pages/Leaves';
import Certificates from './pages/Certificates';
import OrgChart from './pages/OrgChart';
import OOTOH from './pages/OOTOH';
import Expenses from './pages/Expenses';

function App() {
  const { initialized, authenticated } = useAuth();

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounde-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <NetworkStatus />
        <Router future={{ v7_startTransition: true }}>
          <Routes>
            <Route 
              path={AUTH_CONFIG.ROUTES.ROOT} 
              element={
                authenticated ? 
                <Navigate to={AUTH_CONFIG.ROUTES.DASHBOARD} replace /> : 
                <Navigate to={AUTH_CONFIG.ROUTES.LOGIN} replace />
              } 
            />
            <Route path={AUTH_CONFIG.ROUTES.LOGIN} element={<Login />} />
            <Route 
              path={AUTH_CONFIG.ROUTES.DASHBOARD} 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/board/:boardId" 
              element={
                <ProtectedRoute>
                  <Board />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/members"
              element={
                <ProtectedRoute>
                  <Members />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teams"
              element={
                <ProtectedRoute>
                  <Teams />
                </ProtectedRoute>
              }
            />
            <Route
              path="/holidays" 
              element={
                <ProtectedRoute>
                  <Holidays />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/leave-settings" 
              element={
                <ProtectedRoute>
                  <LeaveSettings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/leaves" 
              element={
                <ProtectedRoute>
                  <Leaves />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/certificates"
              element={
                <ProtectedRoute>
                  <Certificates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/org-chart"
              element={
                <ProtectedRoute>
                  <OrgChart />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ootoh"
              element={
                <ProtectedRoute>
                  <OOTOH />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <ProtectedRoute>
                  <Expenses />
                </ProtectedRoute>
              }
            />
            <Route
              path="*"
              element={<Navigate to={AUTH_CONFIG.ROUTES.ROOT} replace />}
            />
          </Routes>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;