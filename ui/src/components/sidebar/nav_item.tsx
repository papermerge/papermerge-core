
type Args = {
  children: JSX.Element;
};

export default function NavItem({children}: Args) {
  return (
    <li className='nav-item'>
      {children}
    </li>
  );
}