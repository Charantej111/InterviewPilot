import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { UserProvider } from './context/UserContext';
import { InterviewProvider } from './context/InterviewContext';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { SetupPage } from './pages/SetupPage';
import { InterviewPreviewPage } from './pages/InterviewPreviewPage';
import { InterviewRoomPage } from './pages/InterviewRoomPage';
import { QuestionFeedbackPage } from './pages/QuestionFeedbackPage';
import { FinalReportPage } from './pages/FinalReportPage';
import { SettingsPage } from './pages/SettingsPage';

import { CustomCursor } from './components/ui/CustomCursor';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <UserProvider>
        <InterviewProvider>
          <CustomCursor />
          <BrowserRouter>
            <Routes>
              {/* Marketing & Auth */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Workspace Dashboard */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Interview Setup Wizard */}
              <Route
                path="/setup"
                element={
                  <ProtectedRoute>
                    <SetupPage />
                  </ProtectedRoute>
                }
              />

              {/* Interview Practice Loops */}
              <Route
                path="/interview/preview"
                element={
                  <ProtectedRoute>
                    <InterviewPreviewPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/interview/:id"
                element={
                  <ProtectedRoute>
                    <InterviewRoomPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/interview/:id/feedback"
                element={
                  <ProtectedRoute>
                    <QuestionFeedbackPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/interview/:id/report"
                element={
                  <ProtectedRoute>
                    <FinalReportPage />
                  </ProtectedRoute>
                }
              />

              {/* User Settings */}
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </InterviewProvider>
      </UserProvider>
    </ThemeProvider>
  );
};

export default App;
