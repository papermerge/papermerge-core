import Cookies from 'js-cookie';

import Dropdown from 'react-bootstrap/Dropdown';
import styles from './layout.module.css';


type Args = {
  children: React.ReactNode;
  username?: string;
  onToggleSidebar?: () => void;
}


export default function CentralBar(
  {username, children, onToggleSidebar}: Args
) {

  const onSignOut = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    console.log("Sign out");
    Cookies.remove('access_token');
    window.location.href = window.location.origin;
  }

  return (
    <div className={styles.central_bar}>
      <nav className='navbar navbar-expand nav-top'>
        <div className='container-fluid'>
          <ul className="navbar-nav">
            <li className="nav-item">
              <a className="nav-link" role="button" onClick={onToggleSidebar}><i className="bi bi-list"></i></a>
            </li>
          </ul>
          <div>
          </div>
          <Dropdown>
            <Dropdown.Toggle variant="light" id="dropdown-basic">
              <i className='bi-person-fill'></i> {username}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item href="/api/docs">
                <i className='bi-book me-2'></i>REST API
              </Dropdown.Item>
              <Dropdown.Item href="#">
                <i className='bi-question-circle me-2'></i>About
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={onSignOut}>
                <i className='bi-box-arrow-right me-2'></i>Sign Out
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
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
