import Cookies from 'js-cookie';

import Dropdown from 'react-bootstrap/Dropdown';
import styles from './layout.module.css';
import Search from 'components/search/search';
import about from 'components/modals/About';
import {
  is_remote_user_enabled,
  get_runtime_config,
  is_oidc_enabled
} from 'runtime_config';


type Args = {
  children: React.ReactNode;
  username?: string;
  onToggleSidebar?: () => void;
  onSubmitSearch: (query: string) => void;
}

type LogoutParams = {
  client_id: string,
  post_logout_redirect_uri?: string
}


export default function CentralBar({
  username, children, onToggleSidebar, onSubmitSearch
}: Args) {

  const onSignOut = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    if (is_remote_user_enabled()) {
      const runtime_config = get_runtime_config();
      const logout_endpoint = runtime_config?.remote_user.logout_endpoint;
      if (logout_endpoint) {
        window.location.href = logout_endpoint;
      } else {
        console.warn("Remote user: logout endpoint is empty")
      }
    } else if(is_oidc_enabled()) {
      console.log("OIDC is enabled");

      const runtime_config = get_runtime_config();
      const logout_url = runtime_config?.oidc.logout_url;
      let logout_params: LogoutParams | null;

      if (runtime_config?.oidc.client_id) {
        const client_id = runtime_config?.oidc.client_id;
        logout_params = {
          client_id: client_id
        }
        if (runtime_config?.oidc.authorize_url) {
          logout_params.post_logout_redirect_uri = `${runtime_config.oidc.authorize_url}?client_id=${client_id}&response_type=code`
        }
        const url_params = new URLSearchParams(logout_params)

        if (logout_url) {
          Cookies.remove('access_token');
          window.location.href = `${logout_url}?${url_params.toString()}`;
        } else {
          console.error("OIDC is enabled but logout_url runtime key is missing")
        }
      } else {
        console.error("OIDC is enabled but client_id runtime key is missing")
      }
    } else {
      Cookies.remove('access_token');
      window.location.reload();
    }
  }

  const onAbout = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    about()
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
          <div className='w-75'>
            <Search onSubmit={onSubmitSearch}/>
          </div>
          <Dropdown>
            <Dropdown.Toggle variant="light" id="dropdown-basic">
              <i className='bi-person-fill'></i> {username}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item href="/api/docs">
                <i className='bi-book me-2'></i>REST API
              </Dropdown.Item>
              <Dropdown.Item onClick={onAbout}>
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
        <div className='d-flex row p-1'>
          {children}
        </div>
      </div>
  </div>
  );
}
