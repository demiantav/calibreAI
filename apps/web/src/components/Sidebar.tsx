import { useEffect, useState, useRef, type ReactNode } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ScrollText, FileText, DollarSign, Sparkles, Moon, Sun, Menu, X, LogOut, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/toggle-switch';
import type { LogEntry } from '@/lib/types';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/logs', label: 'Activity', icon: ScrollText },
  { href: '/pitches', label: 'Pitches', icon: FileText },
  { href: '/sponsorship', label: 'Rates', icon: DollarSign },
];

/* Social links hidden until profiles are connected
const socialLinks = [
  { href: '#', label: 'YouTube', icon: Youtube },
  { href: '#', label: 'Instagram', icon: Instagram },
  { href: '#', label: 'Twitter', icon: Twitter },
  { href: '#', label: 'TikTok', icon: Music2 },
];
*/

/* Routes not yet implemented — hide until ready
const bottomItems = [
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/help', label: 'Help', icon: HelpCircle },
];
*/

const LOGS_ENDPOINT = '/logs';

export function Sidebar() {
  const pathname = useLocation().pathname;
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, updateUser } = useAuth();

  const { data: logs } = useApiFetch<LogEntry[]>(LOGS_ENDPOINT);

  const analysis = logs?.find((log: LogEntry) => log.type === 'media_kit_update');
  const creatorName = analysis?.creator_name;
  const subs = analysis?.content?.subscribers as number | undefined;

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const formatSubs = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  const isActive = (href: string) => pathname === href;

  const sidebarContent = (
    <>
      <div className="px-8 pt-10 pb-8">
        <Link to="/" className="flex items-center gap-3 group" onClick={() => setIsOpen(false)}>
          <motion.div
            whileHover={{ rotate: 180, scale: 1.1 }}
            transition={{ type: 'spring', damping: 10 }}
            className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center neon-glow"
          >
            <Sparkles className="w-6 h-6 text-white" />
          </motion.div>
            <span className="text-xl font-display font-black text-text tracking-tight group-hover:text-accent transition-colors">Calibre</span>
        </Link>
      </div>

      <nav className="flex-1 px-4">
        <p className="px-4 mb-4 text-[11px] font-sans font-black uppercase tracking-[0.15em] text-text-tertiary">
          Menu
        </p>
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    'group relative flex items-center gap-3 px-4 py-3.5 rounded-[16px] text-sm font-semibold transition-all duration-300',
                    active
                      ? 'text-accent'
                      : 'text-text-tertiary hover:text-text hover:bg-surface-hover'
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="active-nav"
                      className="absolute inset-0 bg-accent-muted-soft rounded-[16px] -z-10"
                      transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
                    />
                  )}
                  <Icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", active ? "text-accent" : "text-text-tertiary")} strokeWidth={2} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-8 mb-4 px-4">
          <div className="h-px bg-border/50" />
        </div>

        {/*
        <ul className="space-y-2">
          {bottomItems.map((item) => { ... })}
        </ul>
        */}
      </nav>

      <div className="px-4 pb-6 space-y-4">
        {/* Auto-pitch toggle */}
        <div className="px-4 flex items-center justify-between gap-3 py-2.5 rounded-[16px] bg-surface-hover/50 border border-border/30">
          <div className="flex items-center gap-2 min-w-0">
            <Zap className="w-4 h-4 text-accent shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text truncate">Auto-pitch</p>
              <p className="text-[10px] text-text-tertiary truncate hidden sm:block">Generar borradores automáticamente</p>
            </div>
          </div>
          <Switch
            checked={user?.auto_pitch_enabled ?? false}
            onCheckedChange={async (checked) => {
              try {
                await updateUser({ auto_pitch_enabled: checked });
              } catch {
                // Error handled by AuthContext (rollback + re-fetch)
              }
            }}
            aria-label="Activar auto-pitch"
          />
        </div>

        {/* Theme toggle */}
        <div className="px-4">
          <ThemeToggle />
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3 px-4 py-4 rounded-[20px] bg-surface-hover border border-border/50">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center text-white text-sm font-black shadow-lg">
              {(user?.email || creatorName) ? (user?.email || creatorName || 'C').charAt(0).toUpperCase() : '?'}
            </div>
            <motion.div
              className="absolute -inset-1 rounded-xl bg-accent-muted/20 blur-sm -z-10"
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.1, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-text truncate">{user?.email ?? creatorName ?? 'Creator'}</p>
            <p className="text-[10px] text-accent-muted font-semibold tracking-widest uppercase">Pro Creator</p>
            {subs != null && (
              <p className="text-[10px] text-text-tertiary font-medium mt-0.5">{formatSubs(subs)} Followers</p>
            )}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-text-tertiary hover:text-red-400 hover:bg-red-500/5 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-11 h-11 rounded-xl bg-surface-hover border border-border/50 flex items-center justify-center text-text hover:text-accent transition-colors"
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-4 top-4 bottom-4 w-[260px] rounded-[24px] flex-col z-40 overflow-hidden bg-surface border border-border shadow-lg">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-[280px] rounded-r-[24px] flex-col z-50 overflow-hidden bg-surface border-r border-border shadow-xl"
            >
              <MobileSidebarDrawer onClose={() => setIsOpen(false)}>
                {sidebarContent}
              </MobileSidebarDrawer>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const Icon = theme === 'dark' ? Sun : Moon;

  return (
    <motion.button
      onClick={toggle}
      whileTap={{ scale: 0.95 }}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-[14px] text-xs font-black transition-all duration-200 border border-border/50 bg-surface-hover/50 hover:bg-accent-soft hover:border-accent/20 hover:text-accent"
    >
      <div className="w-7 h-7 rounded-[10px] bg-accent-soft flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-accent" strokeWidth={2.5} />
      </div>
      <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
    </motion.button>
  );
}

function MobileSidebarDrawer({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Focus first focusable element when opened
  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer) return;

    const focusable = drawer.querySelectorAll<HTMLElement>(
      'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    if (first) {
      first.focus();
    }
  }, []);

  return (
    <div ref={drawerRef} className="flex flex-col h-full">
      {children}
    </div>
  );
}
