import type { SimpleComponentArgs } from "types";


export default function Nav({children}: SimpleComponentArgs) {
  return (
    <ul className="nav nav-pills flex-column">
      {children}
    </ul>
  );
}
