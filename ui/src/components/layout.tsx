
import CentralBar from './central_bar';
import styles from './layout.module.css';
import Sidebar from './sidebar/sidebar';
import useSWR from 'swr';
import Cookies from 'js-cookie';
import type { SimpleComponentArgs } from '@/types';

const fetcher = (url:string) => {
  const token = Cookies.get('token');
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  let full_url = `http://localhost:8000${url}`;

  return fetch(full_url, {headers: headers}).then(res => res.json());
}


function useMe() {
  const { data, error, isLoading } = useSWR('/users/me', fetcher);

  return {
    user: data,
    isLoading,
    isError: error
  }
}


function Layout({ children }: SimpleComponentArgs) {
  const { user, isError, isLoading } = useMe();

  if (isLoading) {
    return <div>IsLoading {isLoading}</div>;
  }

  if (isError) {
    return <div>IsError {isError}</div>;
  }

  return (
    <main className={styles.main}>
      <Sidebar />
      <CentralBar>
        {children}
      </CentralBar>
    </main>
  );
}

Layout.requires_auth = true;

export default Layout;
