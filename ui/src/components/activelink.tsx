import React, { MouseEventHandler } from 'react';


type Args = {
  children: React.ReactNode;
  href: string;
  className: string;
}

function ActiveLink({ children, href, className }: Args) {
  let new_className = className;

  return (
    <a href={href} className={new_className}>
      {children}
    </a>
  );
}

export default ActiveLink;
