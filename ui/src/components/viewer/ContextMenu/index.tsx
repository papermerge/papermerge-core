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
    <Dropdown.Item>
      <i className="bi bi-pencil-square me-1"></i>Rename
    </Dropdown.Item>
    <Dropdown.Item>
      <i className="bi bi-eye me-1"></i>OCR Text</Dropdown.Item>
    <Dropdown.Item>
      <i className="bi bi-arrow-right me-1"></i>Move
    </Dropdown.Item>
    <Dropdown.Divider />
    <Dropdown.Item>
      <i className="bi bi-x-lg me-1 text-danger"></i>Delete
    </Dropdown.Item>
  </Dropdown.Menu>
}
