import {useState, useEffect} from 'react';
import Cookies from 'js-cookie';

import CentralBar from './central_bar';
import styles from './layout.module.css';
import Sidebar from './sidebar/sidebar';
import type { SidebarItem, State, User } from 'types';


const fetcher = (url:string) => {
  const token = Cookies.get('access_token');
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

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
  onSidebarItemChange: (item: SidebarItem) => void;
}


function Layout({ children, onSidebarItemChange }: Args) {
  const { data, error, is_loading } = useMe();
  const [ sidebarFolded, setSidebarFolded ] = useState(false);

  const onToggleSidebar = () => {
    setSidebarFolded(!sidebarFolded);
  }

  if (is_loading) {
    return (
      <main className={styles.main}>
        <Sidebar folded={sidebarFolded} onSidebarItemChange={onSidebarItemChange} />
        <CentralBar>
          Loading ...
        </CentralBar>
      </main>
    );
  }

  if (error) {
    return <div>Error</div>;
  }

  return (
    <main className={styles.main}>
      <Sidebar folded={sidebarFolded} onSidebarItemChange={onSidebarItemChange} />
      <CentralBar username={data?.username} onToggleSidebar={onToggleSidebar}>
        {children}
      </CentralBar>
    </main>
  );
}


export default Layout;
