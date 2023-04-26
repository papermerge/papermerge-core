import Nav from './nav';
import NavItem from './nav_item';
import IconHouse from '../icons/house';
import IconInbox from '../icons/inbox';
import ActiveLink from '../activelink';


export default function Sidebar() {
  return (
    <div className="d-flex flex-column flex-shrink-0 p-3 text-white bg-dark">
      <h4 className='brand-text me-2'>Papermerge</h4>
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
