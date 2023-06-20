import Nav from './nav';
import NavItem from './nav_item';
import IconHouse from '../icons/house';
import IconInbox from '../icons/inbox';
import ActiveLink from '../activelink';
import { SpecialFolder } from 'types';


type Args = {
  folded: boolean;
  onSpecialFolderChange: (folder: SpecialFolder) => void;
}

type SidebarArgs = {
  onSpecialFolderChange: (folder: SpecialFolder) => void;
}


function SidebarOpened({onSpecialFolderChange}: SidebarArgs) {

  const onClickHome = () => {
    onSpecialFolderChange("home");
  }

  const onClickInbox = () => {
    onSpecialFolderChange("inbox");
  }

  return (
    <div className="sidebar d-flex flex-column flex-shrink-0 text-white bg-dark">
      <a className='navbar-brand m-2 p-2' href="#">
        <img src="/images/logo.png" width="80" />
        Papermerge DMS
      </a>
      <hr />
      <Nav>
        <NavItem>
          <a href="#" onClick={onClickHome} className='nav-link text-white'>
            <IconHouse /><span className='ms-2'>Home</span>
          </a>
        </NavItem>
        <NavItem>
          <a href="#" onClick={onClickInbox} className='nav-link text-white'>
            <IconInbox/><span className='ms-2'>Inbox</span>
          </a>
        </NavItem>
      </Nav>
    </div>
  );
}


function SidebarFolded({onSpecialFolderChange}: SidebarArgs) {

  const onClickHome = () => {
    onSpecialFolderChange("home");
  }

  const onClickInbox = () => {
    onSpecialFolderChange("inbox")
  }

  return (
    <div className="sidebar d-flex flex-column flex-shrink-0 text-white bg-dark">
      <a className='navbar-brand m-2' href="#">
        <img src="/images/logo.png" width="50" />
      </a>
      <hr />
      <Nav>
        <NavItem>
          <a href="#" onClick={onClickHome} className='nav-link'>
            <IconHouse />
          </a>
        </NavItem>
        <NavItem>
          <a href="#" onClick={onClickInbox} className='nav-link'>
            <IconInbox />
          </a>
        </NavItem>
      </Nav>
    </div>
  );
}


export default function Sidebar({folded, onSpecialFolderChange}: Args) {
  /*
  Sidebar can be folded or opened.
  */

  if (folded) {
    return <SidebarFolded onSpecialFolderChange={onSpecialFolderChange} />;
  }

  return (
    <SidebarOpened onSpecialFolderChange={onSpecialFolderChange} />
  );
}
