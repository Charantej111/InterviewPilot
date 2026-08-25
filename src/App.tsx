import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { UserProvider } from './context/UserContext';
import { InterviewProvider, useInterview } from './context/InterviewContext';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { SetupPage } from './pages/SetupPage';
import { ResumeIntelligencePage } from './pages/ResumeIntelligencePage';
import { InterviewPreviewPage } from './pages/InterviewPreviewPage';
import { InterviewRoomPage } from './pages/InterviewRoomPage';
import { QuestionFeedbackPage } from './pages/QuestionFeedbackPage';
import { FinalReportPage } from './pages/FinalReportPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';

import { CustomCursor } from './components/ui/CustomCursor';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthDiagnosticsOverlay } from './components/auth/AuthDiagnosticsOverlay';
import { EmojiProvider } from 'react-apple-emojis';
import emojiData from 'react-apple-emojis/src/data.json';

export const CompletionRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { id } = useParams<{ id: string }>();
  const { activeSession } = useInterview();

  if (activeSession && activeSession.id === id) {
    const isCompleted =
      activeSession.status === 'completed' ||
      activeSession.status === 'report_generating' ||
      activeSession.status === 'report_ready' ||
      activeSession.status === 'report_failed';

    if (!isCompleted) {
      console.warn('[InterviewIntegrity] Blocked premature feedback navigation');
      return <Navigate to={`/interview/${id}`} replace />;
    }
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <EmojiProvider data={emojiData}>
      <ThemeProvider>
        <UserProvider>
          <InterviewProvider>
            <CustomCursor />
            <BrowserRouter>
              <AuthDiagnosticsOverlay />
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

              {/* Resume Intelligence Review — confirm evidence before interview */}
              <Route
                path="/setup/resume-intelligence"
                element={
                  <ProtectedRoute>
                    <ResumeIntelligencePage />
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
                    <CompletionRouteGuard>
                      <QuestionFeedbackPage />
                    </CompletionRouteGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/interview/:id/report"
                element={
                  <ProtectedRoute>
                    <CompletionRouteGuard>
                      <FinalReportPage />
                    </CompletionRouteGuard>
                  </ProtectedRoute>
                }
              />

              {/* User Settings & Profile */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
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
  </EmojiProvider>
);
};

export default App;
