import Spinner from "../spinner";
import SpinnerPlaceholder from "../spinner_placeholder";
import Form from 'react-bootstrap/Form';

import type { CheckboxChangeType, NodeArgsType } from "./types";
import { DisplayNodesModeEnum } from "../../types";


function Folder({
  node,
  onClick,
  onSelect,
  onDrag,
  onDragEnd,
  onDragStart,
  display_mode,
  is_loading,
  is_selected
}: NodeArgsType) {

  const onclick = () => {
    onClick(node.id);
  }

  const onselect = (event: CheckboxChangeType) => {
    onSelect(node.id, event.target.checked);
  }

  const onDragStartHandle = (event: React.DragEvent) => {
    onDragStart(node.id, event);
  }

  const onDragHandle = (event: React.DragEvent) => {
    onDrag(node.id, event);
  }

  const onDragEndHandle = (event: React.DragEvent) => {
    onDragEnd(node.id, event);
  }

  const css_class_display_mode = () => {
    if (display_mode == DisplayNodesModeEnum.List) {
      return 'd-flex flex-row align-items-center';
    }

    return 'd-flex flex-column';
  }

  return (
    <>
      <div key={node.id}
        className="node folder"
        onDragStart={onDragStartHandle}
        onDrag={onDragHandle}
        onDragEnd={onDragEndHandle}
        draggable>
        {is_loading ? <Spinner />: <SpinnerPlaceholder />}
        <div><Form.Check key={node.id} onChange={onselect} defaultChecked={is_selected} type="checkbox" /></div>
        <div className={css_class_display_mode()}>
          <div className="icon folder"></div>
          <div className="title" onClick={onclick}>{node.title}</div>
        </div>
      </div>
    </>
  );
}

export default Folder;