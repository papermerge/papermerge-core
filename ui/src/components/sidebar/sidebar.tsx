import Nav from './nav';
import NavItem from './nav_item';
import IconHouse from '../icons/house';
import IconInbox from '../icons/inbox';
import ActiveLink from '../activelink';


type Args = {
  folded: boolean;
}


function SidebarOpened() {
  return (
    <div className="sidebar d-flex flex-column flex-shrink-0 text-white bg-dark">
      <a className='navbar-brand m-2 p-2' href="#">
        <img src="/images/logo.png" width="80" />
        Papermerge DMS
      </a>
      <hr />
      <Nav>
        <NavItem>
          <ActiveLink href="/home" className='nav-link text-white'>
            <IconHouse /><span className='ms-2'>Home</span>
          </ActiveLink>
        </NavItem>
        <NavItem>
          <ActiveLink href="/inbox" className='nav-link text-white'>
            <IconInbox/><span className='ms-2'>Inbox</span>
          </ActiveLink>
        </NavItem>
      </Nav>
    </div>
  );
}


function SidebarFolded() {
  return (
    <div className="sidebar d-flex flex-column flex-shrink-0 text-white bg-dark">
      <a className='navbar-brand m-2' href="#">
        <img src="/images/logo.png" width="50" />
      </a>
      <hr />
      <Nav>
        <NavItem>
          <ActiveLink href="/home" className='nav-link text-white'>
            <IconHouse />
          </ActiveLink>
        </NavItem>
        <NavItem>
          <ActiveLink href="/inbox" className='nav-link text-white'>
            <IconInbox />
          </ActiveLink>
        </NavItem>
      </Nav>
    </div>
  );
}


export default function Sidebar({folded}: Args) {
  /*
  Sidebar can be folded or opened.
  */

  if (folded) {
    return <SidebarFolded />;
  }

  return (
    <SidebarOpened />
  );
}
