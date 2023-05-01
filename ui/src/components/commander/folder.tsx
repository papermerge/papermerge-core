import { forwardRef } from 'react';

import Spinner from "../spinner";
import SpinnerPlaceholder from "../spinner_placeholder";
import Form from 'react-bootstrap/Form';

import type { CheckboxChangeType, NodeArgsType } from "./types";
import { DisplayNodesModeEnum } from "../../types";


const Folder = forwardRef<HTMLDivElement, NodeArgsType>(
  (props, ref) => {
    const onclick = () => {
      props.onClick(props.node.id);
    }

    const onselect = (event: CheckboxChangeType) => {
      props.onSelect(props.node.id, event.target.checked);
    }

    const onDragStartHandle = (event: React.DragEvent) => {
      props.onDragStart(props.node.id, event);
    }

    const onDragHandle = (event: React.DragEvent) => {
      props.onDrag(props.node.id, event);
    }

    const onDragEndHandle = (event: React.DragEvent) => {
      props.onDragEnd(props.node.id, event);
    }

    const css_class_display_mode = () => {
      if (props.display_mode == DisplayNodesModeEnum.List) {
        return 'd-flex flex-row align-items-center';
      }

      return 'd-flex flex-column';
    }

    return (
      <>
        <div key={props.node.id} ref={ref}
          className="node folder"
          onDragStart={onDragStartHandle}
          onDrag={onDragHandle}
          onDragEnd={onDragEndHandle}
          draggable>
          {props.is_loading ? <Spinner />: <SpinnerPlaceholder />}
          <div>
            <Form.Check
              key={props.node.id}
              onChange={onselect}
              defaultChecked={props.is_selected}
              type="checkbox" />
          </div>
          <div className={css_class_display_mode()}>
            <div className="icon folder"></div>
            <div className="title" onClick={onclick}>{props.node.title}</div>
          </div>
        </div>
      </>
    );
  }
);

export default Folder;
