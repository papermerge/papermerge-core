import { useState } from 'react';

import Nav from './nav';
import NavItem from './nav_item';
import IconHouse from '../icons/house';
import IconInbox from '../icons/inbox';
import { SpecialFolder } from 'types';


type Args = {
  folded: boolean;
  onSpecialFolderChange: (folder: SpecialFolder) => void;
}

type SidebarArgs = {
  onSpecialFolderChange: (folder: SpecialFolder) => void;
}

type CurrentItemEnum = "inbox" | "home";


function SidebarOpened({onSpecialFolderChange}: SidebarArgs) {

  const [current, setCurrent] = useState<CurrentItemEnum>("home");
  let css_klass = 'nav-link text-white';

  const onClickHome = () => {
    onSpecialFolderChange("home");
    setCurrent("home");
  }

  const onClickInbox = () => {
    onSpecialFolderChange("inbox");
    setCurrent("inbox");
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
          <a href="#" onClick={onClickHome} className={css_klass + (current == 'home' ? ' active': '')}>
            <IconHouse /><span className='ms-2'>Home</span>
          </a>
        </NavItem>
        <NavItem>
          <a href="#" onClick={onClickInbox} className={css_klass + (current == 'inbox' ? ' active': '')}>
            <IconInbox/><span className='ms-2'>Inbox</span>
          </a>
        </NavItem>
      </Nav>
    </div>
  );
}


function SidebarFolded({onSpecialFolderChange}: SidebarArgs) {

  const [current, setCurrent] = useState<CurrentItemEnum>("home");
  let css_klass = 'nav-link text-white';

  const onClickHome = () => {
    onSpecialFolderChange("home");
    setCurrent("home");
  }

  const onClickInbox = () => {
    onSpecialFolderChange("inbox");
    setCurrent("inbox");
  }

  return (
    <div className="sidebar d-flex flex-column flex-shrink-0 text-white bg-dark">
      <a className='navbar-brand m-2' href="#">
        <img src="/images/logo.png" width="50" />
      </a>
      <hr />
      <Nav>
        <NavItem>
          <a href="#" onClick={onClickHome} className={css_klass + (current == 'home' ? ' active': '')}>
            <IconHouse />
          </a>
        </NavItem>
        <NavItem>
          <a href="#" onClick={onClickInbox} className={css_klass + (current == 'inbox' ? ' active': '')}>
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
