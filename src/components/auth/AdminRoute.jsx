import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { PageContainer } from '../ui/PageContainer';
import { StatusPanel } from '../ui/StatusPanel';

export function AdminRoute({ children }) {
  const { isLoading, session, user } = useAuth();
  const isAdmin = user?.user_metadata?.role === 'admin';

  if (isLoading) {
    return (
      <PageContainer>
        <StatusPanel
          title="Restoring admin session"
          description="Checking whether the current Supabase session has admin access."
        />
      </PageContainer>
    );
  }

  if (!session || !isAdmin) {
    return <Navigate replace to="/" />;
  }

  return children ?? <Outlet />;
}
