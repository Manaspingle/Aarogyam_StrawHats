import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';

export default function Layout() {
  const location = useLocation();
  const isDashboardRoute = ['/dashboard', '/hospital-dashboard', '/admin'].some((path) =>
    location.pathname.startsWith(path)
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {!isDashboardRoute && <Navbar />}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
