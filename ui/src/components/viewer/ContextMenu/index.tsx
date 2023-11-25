import { useEffect, useRef, useState } from "react";
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownMenu from 'react-bootstrap/DropdownMenu';


import { TargetFolder } from "types";

type Coord = {
  x: number;
  y: number;
}

const HIDDEN = {
  x: -100000,
  y: -100000
}

type Args = {
  target_folder?: TargetFolder;
  OnDocumentMoveTo: (arg: TargetFolder) => void;
}


export default function ContextMenu({target_folder, OnDocumentMoveTo}: Args) {
  const [position, setPosition] = useState<Coord>(HIDDEN)
  const ref = useRef<HTMLDivElement>(null)



  const onRightClick = (ev: MouseEvent) => {
    ev.preventDefault(); // prevents default context menu

    let new_y = ev.clientY;
    let new_x = ev.clientX;


    setPosition({y: new_y, x: new_x})
  }

  useEffect(() => {
    // detect right click outside
    document.addEventListener('contextmenu', onRightClick);

    return () => {
      document.removeEventListener('contextmenu', onRightClick);
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
        <i className="bi bi-arrow-right me-1"></i>Move
      </Dropdown.Item>
    }
  }

  const onLocalRename = () => {
    console.log('rename')
    onHide()
  }

  const onHide = () => {
    /**
     * Dropdown is always visible; "hide it" actually
     * moves it far away on the screen so that user does not see it.
     * This is because, if show/hide state is employed, then my guess
     * is that when hidden, react removed the dropdown element with its
     * events from the DOM, which result in "events not being fired"*/
    setPosition(HIDDEN)
  }

  return <DropdownMenu
      ref={ref}
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
