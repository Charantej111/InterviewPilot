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
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Interview Setup Wizard */}
              <Route path="/setup" element={<SetupPage />} />

              {/* Interview Practice Loops */}
              <Route path="/interview/preview" element={<InterviewPreviewPage />} />
              <Route path="/interview/:id" element={<InterviewRoomPage />} />
              <Route path="/interview/:id/feedback" element={<QuestionFeedbackPage />} />
              <Route path="/interview/:id/report" element={<FinalReportPage />} />

              {/* User Settings */}
              <Route path="/settings" element={<SettingsPage />} />

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
