import { Link } from 'react-router-dom';
import { buttonVariants } from '../components/ui/Button';
import { PageContainer } from '../components/ui/PageContainer';
import { StatusPanel } from '../components/ui/StatusPanel';

export function NotFoundPage() {
  return (
    <PageContainer>
      <StatusPanel
        title="Page not found"
        description="This route does not exist yet. Return to the home shell to continue exploring the current foundation."
        action={
          <Link className={buttonVariants({ variant: 'primary', size: 'sm' })} to="/">
            Return home
          </Link>
        }
      />
    </PageContainer>
  );
}
