import { useRouter } from 'next/router'
import React, { MouseEventHandler } from 'react';


type Args = {
  children: React.ReactNode;
  href: string;
  className: string;
}

function ActiveLink({ children, href, className }: Args) {
  const router = useRouter()
  let new_className = className;

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault()
    router.push(href)
  }

  if (router.asPath === href) {
    new_className = `${className} active`;
  }

  return (
    <a href={href} className={new_className} onClick={handleClick}>
      {children}
    </a>
  );
}

export default ActiveLink;
