import styles from './layout.module.css'
import type { SimpleComponentArgs } from '@/types';

import { useUser } from '@/contexts/user';


export default function CentralBar({children}: SimpleComponentArgs) {
  const user_context = useUser();

  return (
    <div className={styles.central_bar}>
      <nav className='navbar navbar-expand nav-top'>
        <div className='container-fluid'>
          <ul className="navbar-nav">
            <li className="nav-item">
              <a className="nav-link" role="button"><i className="bi bi-list"></i></a>
            </li>
          </ul>
        </div>
      </nav>
      <div className='container-fluid'>
        <div className='d-flex row'>
          {user_context.user?.username}
          {children}
        </div>
      </div>
  </div>
  );
}