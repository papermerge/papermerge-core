import { useEffect, useRef, useState } from "react";
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownMenu from 'react-bootstrap/DropdownMenu';


import { TargetDirection, TargetFolder } from "types";

type Coord = {
  x: number;
  y: number;
}

/* hiding - means move away element so that user does
not see it */
const HIDDEN = { // far away coordinates
  x: -100000,
  y: -100000
}

type Args = {
  target_folder?: TargetFolder;
  target_direction?: TargetDirection;
  OnDocumentMoveTo: (arg: TargetFolder) => void;
}

export default function ContextMenu({target_folder, target_direction, OnDocumentMoveTo}: Args) {
  const [position, setPosition] = useState<Coord>(HIDDEN)
  const ref = useRef<HTMLDivElement>(null)

  const onRightClick = (ev: MouseEvent) => {
    ev.preventDefault(); // prevents default context menu

    let new_y = ev.clientY;
    let new_x = ev.clientX;

    setPosition({y: new_y, x: new_x})
  }

  const clickOutsideCallback = (e: MouseEvent) => {
    if(ref.current) {
      const rect = ref.current.getClientRects()
      if (rect[0].x > e.clientX) {
        hideMenu()
      }

      if (rect[0].y > e.clientY) {
        hideMenu()
      }
    }
  }

  useEffect(() => {
    // detect right click outside
    document.addEventListener('contextmenu', onRightClick);
    document.addEventListener('mousedown', clickOutsideCallback);

    return () => {
      document.removeEventListener('contextmenu', onRightClick);
      document.removeEventListener('mousedown', clickOutsideCallback);
    }
  }, []);

  const onLocalDocumentMoveTo = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    if (target_folder) {
      OnDocumentMoveTo(target_folder);
    }
  }

  const move_item = () => {
    if (target_folder) {
      return <Dropdown.Item as='button' onClick={onLocalDocumentMoveTo}>
        {direction_icon()} Move
      </Dropdown.Item>
    }
  }

  const direction_icon = () => {
    if (target_direction == 'right') {
      return <i className="bi bi-arrow-right me-1"></i>
    }

    if (target_direction == 'left') {
      return <i className="bi bi-arrow-left me-1"></i>
    }
  }

  const onLocalRename = () => {
    console.log('rename')
    hideMenu()
  }

  const hideMenu = () => {
    /**
     * Dropdown is always visible; "hide it" actually
     * moves it far away on the screen so that user does not see it.
     * This is because, if show/hide state is employed, then my guess
     * is that when hidden, react remove the dropdown element with its
     * events from the DOM, which result in "events not being fired"
     * */
    setPosition(HIDDEN)
  }

  return <DropdownMenu
      ref={ref}
      rootCloseEvent={'click'}
      show={true} // set is always visible so that React keeps element in the DOM
      style={{top: `${position.y}px`, left: `${position.x}px`}}>
    <Dropdown.Item as='button' onClick={onLocalRename}>
      <i className="bi bi-pencil-square me-1"></i>Rename
    </Dropdown.Item>
    <Dropdown.Item as='button'>
      <i className="bi bi-eye me-1"></i>OCR Text</Dropdown.Item>
    {move_item()}
    <Dropdown.Divider />
    <Dropdown.Item as='button'>
      <i className="bi bi-x-lg me-1 text-danger"></i>Delete
    </Dropdown.Item>
  </DropdownMenu>
}
