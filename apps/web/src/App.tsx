import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ThemeProvider } from '@/lib/theme';
import { PulseProvider } from '@/lib/pulse-context';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Logs from './pages/Logs';
import Pitches from './pages/Pitches';
import Sponsorship from './pages/Sponsorship';

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

  return (
    <ThemeProvider>
      <PulseProvider>
      <Layout>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<AnimatedPage><Dashboard /></AnimatedPage>} />
            <Route path="/logs" element={<AnimatedPage><Logs /></AnimatedPage>} />
            <Route path="/pitches" element={<AnimatedPage><Pitches /></AnimatedPage>} />
            <Route path="/sponsorship" element={<AnimatedPage><Sponsorship /></AnimatedPage>} />
          </Routes>
        </AnimatePresence>
      </Layout>
      </PulseProvider>
    </ThemeProvider>
  );
}
