import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ResumeEditor } from './components/editor/ResumeEditor';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { RecruiterDashboard } from './pages/RecruiterDashboard';
import { PublicResume } from './pages/PublicResume';
import { Portfolio } from './pages/Portfolio';
import { AuthPage } from './pages/AuthPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { TwoFactorPage } from './pages/TwoFactorPage';
import { AccountSettingsPage } from './pages/AccountSettingsPage';
import { PaymentPage } from './pages/PaymentPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { ReviewPage } from './pages/ReviewPage';
import { JobTrackerPage } from './pages/JobTrackerPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthenticatedLayout } from './components/layout/AuthenticatedLayout';

import { pdfjs } from 'react-pdf';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage type="login" />} />
          <Route path="/register" element={<AuthPage type="register" />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/2fa-verify" element={<TwoFactorPage />} />

          {/* Protected Routes (with shared layout) */}
          <Route element={
            <ProtectedRoute>
              <AuthenticatedLayout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/editor" element={<ResumeEditor />} />
            <Route path="/editor/:id" element={<ResumeEditor />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/payment/success" element={<PaymentSuccessPage />} />
            <Route path="/settings" element={<AccountSettingsPage />} />
            <Route path="/jobs" element={<JobTrackerPage />} />

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/recruiter"
              element={
                <ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']}>
                  <RecruiterDashboard />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="/cv/:shareKey" element={<PublicResume />} />
          <Route path="/p/:shareKey" element={<Portfolio />} />
          <Route path="/review/:token" element={<ReviewPage />} />

          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
