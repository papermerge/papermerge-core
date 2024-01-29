import { useEffect, useRef } from "react";
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownMenu from 'react-bootstrap/DropdownMenu';


import { TargetDirection, TargetFolder, Coord } from "types";


/* hiding - means move away element so that user does
not see it */

type Args = {
  target_folder?: TargetFolder | null;
  target_direction?: TargetDirection;
  position: Coord;
  selected_pages: Array<string>;
  onDeletePages: () => void;
  onExtractPagesTo: (arg: TargetFolder) => void;
  OnDocumentMoveTo: (arg: TargetFolder) => void;
  OnDocumentDelete: () => void;
  OnRename: () => void;
  OnViewOCRText: () => void;
  hideMenu: () => void;
}

export default function ContextMenu({
  target_folder,
  target_direction,
  position,
  selected_pages,
  hideMenu,
  onDeletePages,
  onExtractPagesTo,
  OnDocumentMoveTo,
  OnDocumentDelete,
  OnRename,
  OnViewOCRText
}: Args) {

  const ref = useRef<HTMLDivElement>(null)

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
    document.addEventListener('mousedown', clickOutsideCallback);

    return () => {
      document.removeEventListener('mousedown', clickOutsideCallback);
    }
  }, []);

  const onLocalDocumentMoveTo = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    if (target_folder) {
      OnDocumentMoveTo(target_folder);
      hideMenu()
    }
  }

  const onLocalExtractPagesTo = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    if (target_folder) {
      onExtractPagesTo(target_folder);
      hideMenu()
    }
  }

  const move_document_item = () => {
    if (target_folder) {
      return <Dropdown.Item as='button' onClick={onLocalDocumentMoveTo}>
        {direction_icon()} Move Document
      </Dropdown.Item>
    }
  }

  const extract_pages_item = () => {
    if (selected_pages.length == 0) {
      return <></>;
    }

    if (!target_folder) {
      return <></>;
    }

    return <Dropdown.Item as='button' onClick={onLocalExtractPagesTo}>
        {direction_icon()} Extract Pages
      </Dropdown.Item>
  }

  const delete_pages = () => {
    if (selected_pages.length == 0) {
      return <></>;
    }

    return <Dropdown.Item as='button' onClick={onDeletePages}>
        <i className="bi bi-trash me-1 text-danger"></i>Delete Pages
      </Dropdown.Item>
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
    OnRename()
    hideMenu()
  }

  const onLocalViewOCRText = () => {
    OnViewOCRText()
    hideMenu()
  }

  return <DropdownMenu
      ref={ref}
      rootCloseEvent={'click'}
      show={true} // set is always visible so that React keeps element in the DOM
      style={{top: `${position.y}px`, left: `${position.x}px`}}>
    <Dropdown.Item as='button' onClick={onLocalRename}>
      <i className="bi bi-pencil-square me-1"></i>Rename
    </Dropdown.Item>
    <Dropdown.Item as='button' onClick={onLocalViewOCRText}>
      <i className="bi bi-eye me-1"></i>OCR Text</Dropdown.Item>
    {extract_pages_item()}
    {move_document_item()}
    {delete_pages()}
    <Dropdown.Divider />
    <Dropdown.Item as='button' onClick={OnDocumentDelete}>
      <i className="bi bi-x-lg me-1 text-danger"></i>Delete Document
    </Dropdown.Item>
  </DropdownMenu>
}
