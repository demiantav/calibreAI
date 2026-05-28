import { Routes, Route, useLocation, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { ThemeProvider } from '@/lib/theme';
import { PulseProvider } from '@/lib/pulse-context';
import { AuthProvider } from '@/contexts/AuthContext';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Logs from './pages/Logs';
import Deals from './pages/Deals';
import Sponsorship from './pages/Sponsorship';
import Contracts from './pages/Contracts';
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

function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top bar with logo */}
      <header className="px-6 py-5 flex items-center justify-center">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-display font-black text-text tracking-tight">Calibre</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-5">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  useKeyboardShortcuts();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isOnboardingPage = location.pathname.startsWith('/onboarding');

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
        ) : isOnboardingPage ? (
          <OnboardingLayout>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/onboarding" element={<AnimatedPage><OnboardingPage /></AnimatedPage>} />
              </Routes>
            </AnimatePresence>
          </OnboardingLayout>
        ) : (
          <PulseProvider>
            <Layout>
              <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                  <Route path="/" element={<ProtectedRoute><AnimatedPage><Dashboard /></AnimatedPage></ProtectedRoute>} />
                  <Route path="/logs" element={<ProtectedRoute><AnimatedPage><Logs /></AnimatedPage></ProtectedRoute>} />
                  <Route path="/deals" element={<ProtectedRoute><AnimatedPage><Deals /></AnimatedPage></ProtectedRoute>} />
                  <Route path="/pitches" element={<ProtectedRoute><AnimatedPage><Deals /></AnimatedPage></ProtectedRoute>} />
                  <Route path="/sponsorship" element={<ProtectedRoute><AnimatedPage><Sponsorship /></AnimatedPage></ProtectedRoute>} />
                  <Route path="/contracts" element={<ProtectedRoute><AnimatedPage><Contracts /></AnimatedPage></ProtectedRoute>} />
                </Routes>
              </AnimatePresence>
            </Layout>
          </PulseProvider>
        )}
      </ThemeProvider>
    </AuthProvider>
  );
}
