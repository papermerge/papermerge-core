import { useEffect, useRef, useState } from "react";
import Dropdown from 'react-bootstrap/Dropdown';

type Coord = {
  x: number;
  y: number;
}


export default function ContextMenu() {
  const [position, setPosition] = useState<Coord>({x: 0, y: 0})
  const [isVisible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null)


  const clickOutsideCallback = () => {
    setVisible(false);
  }

  const onRightClick = (ev: MouseEvent) => {
    const new_visibility = !isVisible;
    ev.preventDefault(); // prevents default context menu

    let new_y = ev.clientY;
    let new_x = ev.clientX;

    if (new_visibility) {
      setPosition({y: new_y, x: new_x})
    }

    setVisible(new_visibility);
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

  return <Dropdown.Menu
      ref={ref}
      show={isVisible}
      style={{top: `${position.y}px`, left: `${position.x}px`}}>
    <Dropdown.Header>Dropdown header</Dropdown.Header>
    <Dropdown.Item eventKey="2">Move To Other Panel</Dropdown.Item>
    <Dropdown.Item eventKey="3">Delete Document</Dropdown.Item>
  </Dropdown.Menu>
}
