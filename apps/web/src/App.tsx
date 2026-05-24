import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ThemeProvider } from '@/lib/theme';
import { PulseProvider } from '@/lib/pulse-context';
import { AuthProvider } from '@/contexts/AuthContext';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Logs from './pages/Logs';
import Pitches from './pages/Pitches';
import Sponsorship from './pages/Sponsorship';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import OnboardingPage from './pages/onboarding/OnboardingPage';

const pageTransition = {
  initial: { opacity: 0, scale: 0.98, y: 6 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 1.01, y: -4 },
};

function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={pageTransition.initial}
      animate={pageTransition.animate}
      exit={pageTransition.exit}
      transition={{ duration: 0.35, ease: [0.45, 0, 0.1, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const location = useLocation();
  useKeyboardShortcuts();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <AuthProvider>
      <ThemeProvider>
        {isAuthPage ? (
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/login" element={<AnimatedPage><LoginPage /></AnimatedPage>} />
              <Route path="/register" element={<AnimatedPage><RegisterPage /></AnimatedPage>} />
            </Routes>
          </AnimatePresence>
        ) : (
          <PulseProvider>
            <Layout>
              <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                  <Route path="/onboarding" element={<AnimatedPage><OnboardingPage /></AnimatedPage>} />
                  <Route path="/" element={<ProtectedRoute><AnimatedPage><Dashboard /></AnimatedPage></ProtectedRoute>} />
                  <Route path="/logs" element={<ProtectedRoute><AnimatedPage><Logs /></AnimatedPage></ProtectedRoute>} />
                  <Route path="/pitches" element={<ProtectedRoute><AnimatedPage><Pitches /></AnimatedPage></ProtectedRoute>} />
                  <Route path="/sponsorship" element={<ProtectedRoute><AnimatedPage><Sponsorship /></AnimatedPage></ProtectedRoute>} />
                </Routes>
              </AnimatePresence>
            </Layout>
          </PulseProvider>
        )}
      </ThemeProvider>
    </AuthProvider>
  );
}
