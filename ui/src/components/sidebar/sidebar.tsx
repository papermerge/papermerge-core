import { useState } from 'react';

import IconHouse from 'components/icons/house';
import IconInbox from 'components/icons/inbox';
import TagIcon from 'components/icons/tag';
import { AppContentBlockEnum } from 'types';

import "./sidebar.scss";

import Nav from './nav';
import NavItem from './nav_item';


type Args = {
  scopes: Array<string>;
  folded: boolean;
  onSidebarItemChange: (item: AppContentBlockEnum) => void;
}

type SidebarArgs = {
  scopes: Array<string>;
  onClick: (item: AppContentBlockEnum) => void;
  current: AppContentBlockEnum;
}


function class_name(item: AppContentBlockEnum, current: AppContentBlockEnum): string {
  /**
   * Returns the css class name of the active link
   */
  return 'nav-link text-white' + (current == item ? ' active': '');
}


function SidebarOpened({onClick, current, scopes}: SidebarArgs) {
  return (
    <div className="sidebar opened d-flex flex-column flex-shrink-0 text-white bg-dark">
      <a className='navbar-brand m-2' href="#">
        <img src="/images/papermerge1.svg" width="80" />
        <p className='mt-2 text-center'>Papermerge DMS</p>
      </a>
      <hr />
      <Nav>
        <NavItem>
          <a href="#" onClick={() => onClick(AppContentBlockEnum.home)} className={class_name(AppContentBlockEnum.home, current)}>
            <IconHouse /><span className='ms-2'>Home</span>
          </a>
        </NavItem>
        <NavItem>
          <a href="#" onClick={() => onClick(AppContentBlockEnum.inbox)} className={class_name(AppContentBlockEnum.inbox, current)}>
            <IconInbox/><span className='ms-2'>Inbox</span>
          </a>
        </NavItem>
        <NavItem>
          <a href="#" onClick={() => onClick(AppContentBlockEnum.tags)} className={class_name(AppContentBlockEnum.tags, current)}>
           <TagIcon /><span className='ms-2'>Tags</span>
          </a>
        </NavItem>
        {scopes.includes('user.view') && (<NavItem>
          <a href="#" onClick={() => onClick(AppContentBlockEnum.users)} className={class_name(AppContentBlockEnum.users, current)}>
            <i className='bi-people'></i><span className='ms-2'>Users</span>
          </a>
        </NavItem>)}
        {scopes.includes('group.view') && (<NavItem>
          <a href="#" onClick={() => onClick(AppContentBlockEnum.groups)} className={class_name(AppContentBlockEnum.groups, current)}>
            <i className='bi-grid'></i><span className='ms-2'>Groups</span>
          </a>
        </NavItem>)}
      </Nav>
    </div>
  );
}


function SidebarFolded({onClick, current, scopes}: SidebarArgs) {
  return (
    <div className="sidebar folded d-flex flex-column flex-shrink-0 text-white bg-dark">
      <a className='navbar-brand m-2' href="#">
        <img width="60px" src="/images/papermerge2.svg"/>
      </a>
      <hr />
      <Nav>
        <NavItem>
          <a href="#" onClick={() => onClick(AppContentBlockEnum.home)} className={class_name(AppContentBlockEnum.home, current)}>
            <IconHouse />
          </a>
        </NavItem>
        <NavItem>
          <a href="#" onClick={() => onClick(AppContentBlockEnum.inbox)} className={class_name(AppContentBlockEnum.inbox, current)}>
            <IconInbox />
          </a>
        </NavItem>
        <NavItem>
          <a href="#" onClick={() => onClick(AppContentBlockEnum.tags)} className={class_name(AppContentBlockEnum.tags, current)}>
           <TagIcon />
          </a>
        </NavItem>
        {scopes.includes('user.view') && (<NavItem>
          <a href="#" onClick={() => onClick(AppContentBlockEnum.users)} className={class_name(AppContentBlockEnum.users, current)}>
            <i className='bi-people'></i>
          </a>
        </NavItem>)}
        {scopes.includes('group.view') && (<NavItem>
          <a href="#" onClick={() => onClick(AppContentBlockEnum.groups)} className={class_name(AppContentBlockEnum.groups, current)}>
            <i className='bi-grid'></i>
          </a>
        </NavItem>)}
      </Nav>
    </div>
  );
}


export default function Sidebar({folded, onSidebarItemChange, scopes}: Args) {
  /*
  Sidebar can be folded or opened.
  */
  const [current, setCurrent] = useState<AppContentBlockEnum>(AppContentBlockEnum.home);

  const onClickHandler = (item: AppContentBlockEnum) => {
    onSidebarItemChange(item);
    setCurrent(item);
  }

  if (folded) {
    return <SidebarFolded
      scopes={scopes}
      current={current}
      onClick={onClickHandler} />;
  }

  return (
    <SidebarOpened
      scopes={scopes}
      current={current}
      onClick={onClickHandler} />
  );
}
