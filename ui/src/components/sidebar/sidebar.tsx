import { useState } from 'react';

import IconHouse from 'components/icons/house';
import IconInbox from 'components/icons/inbox';
import TagIcon from 'components/icons/tag';
import { SidebarItem } from 'types';

import Nav from './nav';
import NavItem from './nav_item';


type Args = {
  folded: boolean;
  onSidebarItemChange: (item: SidebarItem) => void;
}

type SidebarArgs = {
  onClick: (item: SidebarItem) => void;
  current: SidebarItem;
}


function class_name(item: SidebarItem, current: SidebarItem): string {
  /**
   * Returns the css class name of the active link
   */
  return 'nav-link text-white' + (current == item ? ' active': '');
}


function SidebarOpened({onClick, current}: SidebarArgs) {
  return (
    <div className="sidebar d-flex flex-column flex-shrink-0 text-white bg-dark">
      <a className='navbar-brand m-2 p-2' href="#">
        <img src="/images/logo.png" width="80" />
        Papermerge DMS
      </a>
      <hr />
      <Nav>
        <NavItem>
          <a href="#" onClick={() => onClick(SidebarItem.home)} className={class_name(SidebarItem.home, current)}>
            <IconHouse /><span className='ms-2'>Home</span>
          </a>
        </NavItem>
        <NavItem>
          <a href="#" onClick={() => onClick(SidebarItem.inbox)} className={class_name(SidebarItem.inbox, current)}>
            <IconInbox/><span className='ms-2'>Inbox</span>
          </a>
        </NavItem>
        <NavItem>
          <a href="#" onClick={() => onClick(SidebarItem.tags)} className={class_name(SidebarItem.tags, current)}>
           <TagIcon /><span className='ms-2'>Tags</span>
          </a>
        </NavItem>
      </Nav>
    </div>
  );
}


function SidebarFolded({onClick, current}: SidebarArgs) {
  return (
    <div className="sidebar d-flex flex-column flex-shrink-0 text-white bg-dark">
      <a className='navbar-brand m-2' href="#">
        <img src="/images/logo.png" width="50" />
      </a>
      <hr />
      <Nav>
        <NavItem>
          <a href="#" onClick={() => onClick(SidebarItem.home)} className={class_name(SidebarItem.home, current)}>
            <IconHouse />
          </a>
        </NavItem>
        <NavItem>
          <a href="#" onClick={() => onClick(SidebarItem.inbox)} className={class_name(SidebarItem.inbox, current)}>
            <IconInbox />
          </a>
        </NavItem>
        <NavItem>
          <a href="#" onClick={() => onClick(SidebarItem.tags)} className={class_name(SidebarItem.tags, current)}>
           <TagIcon />
          </a>
        </NavItem>
      </Nav>
    </div>
  );
}


export default function Sidebar({folded, onSidebarItemChange}: Args) {
  /*
  Sidebar can be folded or opened.
  */
  const [current, setCurrent] = useState<SidebarItem>(SidebarItem.home);

  const onClickHandler = (item: SidebarItem) => {
    onSidebarItemChange(item);
    setCurrent(item);
  }

  if (folded) {
    return <SidebarFolded
      current={current}
      onClick={onClickHandler} />;
  }

  return (
    <SidebarOpened
      current={current}
      onClick={onClickHandler} />
  );
}
