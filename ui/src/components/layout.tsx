import {useState, useEffect} from 'react';
import Cookies from 'js-cookie';

import CentralBar from './central_bar';
import styles from './layout.module.css';
import Sidebar from './sidebar/sidebar';
import type { AppContentBlockEnum, State, User } from 'types';
import { ToastProvider } from 'components/toasts/ToastsProvider';
import SessionEnd from './SessionEnded';
import { get_default_headers, fetcher_post } from 'utils/fetcher';


const fetcher = (url:string) => {
  const headers = get_default_headers();

  return fetch(url, {headers: headers}).then(res => res.json());
}


export function useMe() {
  const initial_user_state: State<User | null> = {
    is_loading: true,
    error: null,
    data: null
  }
  const [user, setUser] = useState<State<User | null>>(initial_user_state);

  useEffect(() => {
   fetcher(`/api/users/me`).then(
    (data: User) => {
      let ready_state: State<User> = {
        is_loading: false,
        error: null,
        data: data
      };
      setUser(ready_state);
    }
   ).catch(error => {
      setUser({
        is_loading: false,
        error: error,
        data: null
      });
   })
  }, []);

  return user;
}

type Args = {
  children: React.ReactNode;
  onContentBlockChange: (item: AppContentBlockEnum) => void;
  onSearchSubmit: (query: string) => void;
}


function Layout({ children, onContentBlockChange, onSearchSubmit }: Args) {
  const { data, error, is_loading } = useMe();
  const [ sidebarFolded, setSidebarFolded ] = useState(false);

  const onToggleSidebar = () => {
    setSidebarFolded(!sidebarFolded);
  }

  if (is_loading) {
    return (
      <main className={styles.main}>
        <Sidebar
          folded={sidebarFolded}
          onSidebarItemChange={onContentBlockChange}
          scopes={data?.scopes || []} />
        <CentralBar onSubmitSearch={onSearchSubmit}>
          Loading ...
        </CentralBar>
      </main>
    );
  }

  if (error) {
    return <SessionEnd />
  }

  return (
    <main className={styles.main}>
      <ToastProvider>
        <Sidebar scopes={data?.scopes || []} folded={sidebarFolded} onSidebarItemChange={onContentBlockChange} />
        <CentralBar
          username={data?.username}
          onToggleSidebar={onToggleSidebar}
          onSubmitSearch={onSearchSubmit}>
          {children}
        </CentralBar>
      </ToastProvider>
    </main>
  );
}


export default Layout;
