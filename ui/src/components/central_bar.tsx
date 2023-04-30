import styles from './layout.module.css';
import Cookies from 'js-cookie';
import type { SimpleComponentArgs } from '@/types';


export default function CentralBar({children}: SimpleComponentArgs) {

  const onSignOut = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    console.log("Sign out");
    Cookies.remove('access_token');
    window.location.reload();
  }

  return (
    <div className={styles.central_bar}>
      <nav className='navbar navbar-expand nav-top'>
        <div className='container-fluid'>
          <ul className="navbar-nav">
            <li className="nav-item">
              <a className="nav-link" role="button"><i className="bi bi-list"></i></a>
            </li>
          </ul>
          <div>
            <a href="" onClick={onSignOut}>Sign Out</a>
          </div>
        </div>
      </nav>
      <div className='container-fluid'>
        <div className='d-flex row'>
          {children}
        </div>
      </div>
  </div>
  );
}