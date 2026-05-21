import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, ScrollText, FileText, DollarSign, Sparkles, Settings, HelpCircle, Youtube, Instagram, Twitter, Music2, Moon, Sun, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/logs', label: 'Activity', icon: ScrollText },
  { href: '/pitches', label: 'Pitches', icon: FileText },
  { href: '/sponsorship', label: 'Rates', icon: DollarSign },
];

const socialLinks = [
  { href: '#', label: 'YouTube', icon: Youtube },
  { href: '#', label: 'Instagram', icon: Instagram },
  { href: '#', label: 'Twitter', icon: Twitter },
  { href: '#', label: 'TikTok', icon: Music2 },
];

const bottomItems = [
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/help', label: 'Help', icon: HelpCircle },
];

export function Sidebar() {
  const pathname = useLocation().pathname;
  const [creatorName, setCreatorName] = useState('Sarah Chen');
  const [subscriberCount, setSubscriberCount] = useState(127500);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('http://localhost:8080/logs');
        if (res.ok) {
          const data = await res.json();
          const analysis = data.find((log: any) => log.type === 'media_kit_update');
          if (analysis) {
            setCreatorName(analysis.creator_name || 'Sarah Chen');
            const subs = analysis.content?.subscribers;
            if (subs) setSubscriberCount(subs);
          }
        }
      } catch {}
    };
    fetchProfile();
  }, []);

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
          <span className="text-xl font-display font-black text-text tracking-tighter group-hover:text-accent transition-colors">Calibre</span>
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
                    'group relative flex items-center gap-3 px-4 py-3.5 rounded-[16px] text-sm font-bold transition-all duration-300',
                    active
                      ? 'text-accent'
                      : 'text-text-tertiary hover:text-text hover:bg-surface-hover'
                  )}
                >
                  {                    active && (
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

        <ul className="space-y-2">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    'group relative flex items-center gap-3 px-4 py-3 rounded-[14px] text-xs font-bold transition-all duration-300',
                    active
                      ? 'text-accent'
                      : 'text-text-tertiary hover:text-text hover:bg-surface-hover'
                  )}
                >
                  <Icon className={cn("w-4 h-4", active ? "text-accent" : "text-text-tertiary")} strokeWidth={2} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-4 pb-6 space-y-4">
        {/* Theme toggle */}
        <div className="px-4">
          <ThemeToggle />
        </div>

        {/* Social icons */}
        <div className="px-4">
          <p className="mb-3 text-[10px] font-sans font-black uppercase tracking-[0.12em] text-text-tertiary">
            Social
          </p>
          <div className="flex items-center gap-2">
            {socialLinks.map((item) => {
              const Icon = item.icon;
              return (
                <motion.a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.15, y: -1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-8 h-8 rounded-xl bg-surface-hover border border-border/50 flex items-center justify-center text-text-tertiary hover:text-accent hover:border-accent/20 hover:bg-accent-soft hover:shadow-lg hover:shadow-accent/10 transition-colors duration-200"
                  title={item.label}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                </motion.a>
              );
            })}
          </div>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3 px-4 py-4 rounded-[20px] bg-surface-hover border border-border/50">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center text-white text-sm font-black shadow-lg">
              {creatorName.charAt(0).toUpperCase()}
            </div>
            <motion.div
              className="absolute -inset-1 rounded-xl bg-accent-muted/20 blur-sm -z-10"
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.1, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-text truncate">{creatorName}</p>
            <p className="text-[10px] text-accent-muted font-black tracking-widest uppercase">Pro Creator</p>
            <p className="text-[10px] text-text-tertiary font-bold mt-0.5">{formatSubs(subscriberCount)} Followers</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-surface-hover border border-border/50 flex items-center justify-center text-text hover:text-accent transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Desktop sidebar — always visible */}
      <aside className="hidden lg:flex fixed left-4 top-4 bottom-4 w-[260px] glass-card rounded-[24px] flex-col z-40 overflow-hidden">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar — overlay drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-[280px] glass-card rounded-r-[24px] flex-col z-50 overflow-hidden"
            >
              {sidebarContent}
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
