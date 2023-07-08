import { forwardRef } from 'react';

import Spinner from "../../spinner";
import SpinnerPlaceholder from "../../spinner_placeholder";
import Form from 'react-bootstrap/Form';

import type { CheckboxChangeType, NodeArgsType } from "../types";
import { ColoredTagType, DisplayNodesModeEnum } from "types";
import TagsComponent from './tags';



const Folder = forwardRef<HTMLDivElement, NodeArgsType>(
  (props, ref) => {
    const onclick = () => {
      props.onClick({
        node_id: props.node.id,
        node_type: props.node.ctype
      });
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

    const css_class_node = (): string => {
      let css_class = 'node folder';

      if (props.node.accept_dropped_nodes) {
        css_class += ' accept_dropped_nodes ';
      }

      if (props.node.is_currently_dragged) {
        css_class += ' dragged ';
      }

      return css_class;
    }

    return (
      <>
        <div key={props.node.id} ref={ref}
          className={css_class_node()}
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
          <TagsComponent tags={props.node.tags} max_items={3}/>
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
