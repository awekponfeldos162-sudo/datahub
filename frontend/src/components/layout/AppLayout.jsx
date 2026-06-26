import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { platformsApi } from '../../api/client';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout() {
  const { data: platformsData } = useQuery({
    queryKey: ['platforms'],
    queryFn: () => platformsApi.getAll().then((r) => r.data),
    staleTime: 10 * 60 * 1000,
  });

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* WCAG 2.1 AA — skip to main content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-800 focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        Aller au contenu principal
      </a>

      <Sidebar connectedPlatforms={platformsData || []} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main id="main-content" className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
