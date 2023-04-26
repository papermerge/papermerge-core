import { useEffect } from 'react';
import { useRouter } from 'next/router';

import { useAuth } from '@/contexts/auth';
import LoadingScreen from './loading_screen';

type Args = {
  public_routes: Array<string>;
  children: JSX.Element;
}


function ProtectedRoute({ public_routes, children }: Args): JSX.Element {

  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  let path_is_protected = true;

  if (public_routes.indexOf(router.pathname) !== -1) {
    path_is_protected = false;
  }

  useEffect(() => {
    if (!isLoading && !isAuthenticated && path_is_protected) {
      // Redirect route, you can point this to /login
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, path_is_protected]);

  if ((isLoading || !isAuthenticated) && path_is_protected) {
    return <LoadingScreen />;
  }


  return children;
}

export default ProtectedRoute;
