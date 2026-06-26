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
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar connectedPlatforms={platformsData || []} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
