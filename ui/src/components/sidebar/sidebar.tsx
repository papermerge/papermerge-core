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
      <h4 className='brand-text m-2 p-2'>Papermerge</h4>
      <hr />
      <Nav>
        <NavItem>
          <ActiveLink href="/home" className='nav-link text-white'>
            <IconHouse />Home
          </ActiveLink>
        </NavItem>
        <NavItem>
          <ActiveLink href="/inbox" className='nav-link text-white'>
            <IconInbox />Inbox
          </ActiveLink>
        </NavItem>
      </Nav>
    </div>
  );
}


function SidebarFolded() {
  return (
    <div className="sidebar d-flex flex-column flex-shrink-0 text-white bg-dark">
      <h4 className='brand-text m-2 p-2'>P</h4>
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
