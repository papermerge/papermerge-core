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


function class_name(item: CurrentItemEnum, current: CurrentItemEnum): string {
  /**
   * Returns the css class name of the active link
   */
  return 'nav-link text-white' + (current == item ? ' active': '');
}


function SidebarOpened({onSpecialFolderChange}: SidebarArgs) {

  const [current, setCurrent] = useState<CurrentItemEnum>("home");

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
          <a href="#" onClick={onClickHome} className={class_name('home', current)}>
            <IconHouse /><span className='ms-2'>Home</span>
          </a>
        </NavItem>
        <NavItem>
          <a href="#" onClick={onClickInbox} className={class_name('inbox', current)}>
            <IconInbox/><span className='ms-2'>Inbox</span>
          </a>
        </NavItem>
      </Nav>
    </div>
  );
}


function SidebarFolded({onSpecialFolderChange}: SidebarArgs) {

  const [current, setCurrent] = useState<CurrentItemEnum>("home");

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
          <a href="#" onClick={onClickHome} className={class_name('home', current)}>
            <IconHouse />
          </a>
        </NavItem>
        <NavItem>
          <a href="#" onClick={onClickInbox} className={class_name('inbox', current)}>
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
