import { useEffect, useRef, useState } from "react";
import Dropdown from 'react-bootstrap/Dropdown';

type Coord = {
  clientX: number;
  clientY: number;
}


export default function ContextMenu() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setVisible] = useState(false);

  const clickOutsideCallback = () => {
    setVisible(false);
  }

  const onRightClick = (ev: MouseEvent) => {
    const new_visibility = !isVisible;
    ev.preventDefault(); // prevents default context menu

    setVisible(new_visibility);

    if (new_visibility) {
      if (ref && ref.current) {
        ref.current.style.top = `${ev.clientY + 2}px`;
        ref.current.style.left = `${ev.clientX + 2}px`;
      }
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', clickOutsideCallback);
    // detect right click outside
    document.addEventListener('contextmenu', onRightClick);
    return () => {
      document.removeEventListener('mousedown', clickOutsideCallback);
      document.removeEventListener('contextmenu', onRightClick);
    }
  }, []);

  return <Dropdown.Menu ref={ref} show={isVisible}>
    <Dropdown.Header>Dropdown header</Dropdown.Header>
    <Dropdown.Item eventKey="2">Another action</Dropdown.Item>
    <Dropdown.Item eventKey="3">Something else here</Dropdown.Item>
  </Dropdown.Menu>
}
