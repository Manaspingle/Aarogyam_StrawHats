import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, Globe, Shield, Heart, Building2, Sun, Moon, Siren } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage, type Language } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';
import EmergencyAccidentModal from './EmergencyAccidentModal';

export type NavItem = {
  id: string;
  label: string;
  icon: ReactNode;
};

type DashboardLayoutProps = {
  children: ReactNode;
  navItems: NavItem[];
  activeView: string;
  onNavigate: (id: string) => void;
  roleLabel: string;
};

export function DashboardLayout({ children, navItems, activeView, onNavigate, roleLabel }: DashboardLayoutProps) {
  const { profile, donor, hospital, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  const displayName =
    donor?.full_name ||
    hospital?.hospital_name ||
    profile?.full_name ||
    (profile?.role === 'hospital' ? 'Hospital Admin' : 'Donor');

  const roleIcon =
    profile?.role === 'hospital' ? (
      <Building2 className="h-3.5 w-3.5 text-brand-teal" />
    ) : profile?.role === 'admin' ? (
      <Shield className="h-3.5 w-3.5 text-amber-500" />
    ) : (
      <Heart className="h-3.5 w-3.5 text-brand-orange" />
    );

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Sidebar — Desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm lg:flex">
        {/* Brand header */}
        <div className="flex h-20 items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <img
                src="/aarogyam-logo.jpg"
                alt="Aarogyam Logo"
                className="w-10 h-10 object-cover rounded-xl border border-brand-orange/40 shadow-sm group-hover:scale-105 transition-transform"
              />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-orange rounded-full animate-pulse" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-brand-teal dark:text-teal-400 block leading-tight">
                Aarogyam
              </span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase block">
                Healthcare Network
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {t('dashboard.navigation')}
          </div>
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all relative text-left cursor-pointer',
                  isActive
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-brand-teal dark:text-teal-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100',
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-brand-teal dark:bg-teal-400" />
                )}
                <span className={cn('transition-colors', isActive ? 'text-brand-teal dark:text-teal-400' : 'text-slate-400 group-hover:text-slate-600')}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Emergency SOS Quick Button */}
        <div className="p-3">
          <button
            type="button"
            onClick={() => setEmergencyOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-red-600/20 transition-all cursor-pointer"
          >
            <Siren className="w-4 h-4 animate-bounce" />
            <span>{t('emergency.btn')}</span>
          </button>
        </div>

        {/* User profile footer */}
        <div className="border-t border-slate-100 dark:border-slate-800 p-3.5 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-850 p-2.5 shadow-xs">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-teal text-sm font-black text-white shadow-xs">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-black text-slate-900 dark:text-slate-100 leading-tight">
                {displayName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {roleIcon}
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 capitalize leading-none">
                  {roleLabel === 'Hospital Admin' ? t('dashboard.hospital_admin') : roleLabel === 'Verified Donor' ? t('dashboard.verified_donor') : roleLabel}
                </span>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              title={t('nav.sign_out')}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-600 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 sm:px-4 lg:hidden">
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <img src="/aarogyam-logo.jpg" alt="Aarogyam Logo" className="h-8 w-8 rounded-lg object-cover shrink-0" />
          <div className="truncate">
            <span className="text-sm font-black text-brand-teal dark:text-teal-400 block leading-none">Aarogyam</span>
            <span className="text-[9px] font-bold text-brand-orange uppercase leading-none mt-0.5 block truncate">
              {roleLabel === 'Hospital Admin' ? t('dashboard.hospital_admin') : roleLabel === 'Verified Donor' ? t('dashboard.verified_donor') : roleLabel}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Mobile Language Selector */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 sm:px-2 py-1 shadow-xs">
            <Globe className="h-3 w-3 text-brand-orange shrink-0" />
            <select
              aria-label="Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-transparent text-[11px] font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="en" className="dark:bg-slate-800 text-slate-900 dark:text-white">EN</option>
              <option value="hi" className="dark:bg-slate-800 text-slate-900 dark:text-white">हिन्दी</option>
              <option value="mr" className="dark:bg-slate-800 text-slate-900 dark:text-white">मराठी</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => setEmergencyOpen(true)}
            className="px-2 sm:px-2.5 py-1.5 rounded-lg bg-red-600 text-white font-bold text-xs flex items-center gap-1 shrink-0"
          >
            <Siren className="w-3.5 h-3.5" /> <span className="hidden xs:inline">SOS</span>
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 p-1.5 sm:p-2 text-slate-600 dark:text-slate-300"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-white dark:bg-slate-900 shadow-2xl z-50">
            <div className="flex h-16 items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5">
              <div className="flex items-center gap-2.5">
                <img src="/aarogyam-logo.jpg" alt="Aarogyam Logo" className="h-8 w-8 rounded-lg object-cover" />
                <span className="text-base font-black text-brand-teal dark:text-teal-400">Aarogyam</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setMobileOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all text-left',
                      isActive
                        ? 'bg-teal-50 dark:bg-teal-950/60 text-brand-teal dark:text-teal-300'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800',
                    )}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-500">{t('common.language')}</span>
                <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1">
                  <Globe className="h-3.5 w-3.5 text-brand-orange" />
                  <select
                    aria-label="Language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="en">English</option>
                    <option value="hi">हिन्दी</option>
                    <option value="mr">मराठी</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" /> {t('nav.sign_out')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 lg:pl-64">
        {/* Top desktop header bar */}
        <header className="hidden lg:flex h-16 items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-8 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {t('dashboard.workspace')}
            </span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-xs font-extrabold text-brand-teal dark:text-teal-400 capitalize">
              {t('donor.nav_' + activeView) !== ('donor.nav_' + activeView) ? t('donor.nav_' + activeView) : (t('hospital.nav_' + activeView) !== ('hospital.nav_' + activeView) ? t('hospital.nav_' + activeView) : activeView)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-amber-400 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-xs"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Language Selector */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 shadow-xs">
              <Globe className="h-3.5 w-3.5 text-brand-orange shrink-0" />
              <select
                aria-label="Language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
              >
                <option value="en" className="dark:bg-slate-800 text-slate-900 dark:text-white">EN</option>
                <option value="hi" className="dark:bg-slate-800 text-slate-900 dark:text-white">हिन्दी</option>
                <option value="mr" className="dark:bg-slate-800 text-slate-900 dark:text-white">मराठी</option>
              </select>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl p-3.5 sm:p-6 lg:p-8">{children}</div>
      </main>

      {/* Emergency Modal */}
      <EmergencyAccidentModal
        isOpen={emergencyOpen}
        onClose={() => setEmergencyOpen(false)}
      />
    </div>
  );
}

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  badge?: ReactNode;
};

export function PageHeader({ title, description, action, badge }: PageHeaderProps) {
  return (
    <div className="mb-5 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/60 dark:border-slate-800 pb-4 sm:pb-5">
      <div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">{title}</h1>
          {badge}
        </div>
        {description && <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl font-medium">{description}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">{action}</div>}
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: string | number;
  icon: ReactNode;
  color?: 'red' | 'blue' | 'green' | 'amber' | 'purple' | 'teal' | 'orange';
  subtitle?: string;
};

const statColors: Record<string, { bg: string; text: string; ring: string }> = {
  red: { bg: 'bg-red-50 dark:bg-red-950/60', text: 'text-red-600 dark:text-red-400', ring: 'border-red-100 dark:border-red-900/60' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-950/60', text: 'text-blue-600 dark:text-blue-400', ring: 'border-blue-100 dark:border-blue-900/60' },
  green: { bg: 'bg-emerald-50 dark:bg-emerald-950/60', text: 'text-emerald-600 dark:text-emerald-400', ring: 'border-emerald-100 dark:border-emerald-900/60' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-950/60', text: 'text-amber-600 dark:text-amber-400', ring: 'border-amber-100 dark:border-amber-900/60' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-950/60', text: 'text-purple-600 dark:text-purple-400', ring: 'border-purple-100 dark:border-purple-900/60' },
  teal: { bg: 'bg-teal-50 dark:bg-teal-950/60', text: 'text-brand-teal dark:text-teal-400', ring: 'border-teal-100 dark:border-teal-900/60' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-950/60', text: 'text-brand-orange dark:text-orange-400', ring: 'border-orange-100 dark:border-orange-900/60' },
};

export function StatCard({ label, value, icon, color = 'teal', subtitle }: StatCardProps) {
  const styles = statColors[color] || statColors.teal;
  return (
    <div className="group rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm transition-all duration-200 hover:border-brand-teal/40 hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</span>
        <div
          className={cn(
            'flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl border shadow-xs transition-transform duration-200 group-hover:scale-105',
            styles.bg,
            styles.text,
            styles.ring,
          )}
        >
          {icon}
        </div>
      </div>
      <p className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">{value}</p>
      {subtitle && <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 font-semibold">{subtitle}</p>}
    </div>
  );
}
