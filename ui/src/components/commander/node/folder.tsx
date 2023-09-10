import { forwardRef, useState } from 'react';

import Spinner from "../../spinner";
import SpinnerPlaceholder from "../../spinner_placeholder";
import Form from 'react-bootstrap/Form';

import type { NodeType, NodeClickArgsType } from 'types';
import type { CheckboxChangeType } from "../types";
import { DisplayNodesModeEnum } from "types";
import TagsComponent from './tags';


type FolderArgsType = {
  node: NodeType;
  onClick: ({node_id, node_type}: NodeClickArgsType) => void;
  onSelect: (node_id: string, selected: boolean) => void;
  onDragStart: (node_id: string, event: React.DragEvent) => void;
  onDrag: (node_id: string, event: React.DragEvent) => void;
  onDragEnd: (node_id: string, event: React.DragEvent) => void;
  is_loading: boolean;
  is_selected: boolean;
  display_mode: DisplayNodesModeEnum;
  onSetAsDropTarget: (folder_target: NodeType | null) => void;
}


const ACCEPT_DROPPED_NODES = "accept_dropped_nodes";


const Folder = forwardRef<HTMLDivElement, FolderArgsType>(
  (props, ref) => {
    const onclick = () => {
      props.onClick({
        node_id: props.node.id,
        node_type: props.node.ctype
      });
    }
    const [ cssAcceptFilesAndNodes, setCssAcceptFilesAndNodes ] = useState<string>("");
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

    const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
      setCssAcceptFilesAndNodes(ACCEPT_DROPPED_NODES);
      props.onSetAsDropTarget(props.node);
    }

    const onDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
      setCssAcceptFilesAndNodes(ACCEPT_DROPPED_NODES);
      props.onSetAsDropTarget(props.node);
    }

    const onDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
      setCssAcceptFilesAndNodes("");
      props.onSetAsDropTarget(null);
    }

    const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setCssAcceptFilesAndNodes("");
    }

    const css_class_node = (): string => {
      let css_class: string = '';

      if (props.display_mode == DisplayNodesModeEnum.Tiles) {
        css_class = 'node folder tile';
      } else {
        css_class = 'node folder list';
      }

      if (props.node.is_currently_dragged) {
        css_class += ' dragged ';
      }

      return css_class;
    }

    if (props.display_mode == DisplayNodesModeEnum.Tiles) {
      return (
        <>
          <div key={props.node.id} ref={ref}
            className={css_class_node() + " " + cssAcceptFilesAndNodes}
            onDragStart={onDragStartHandle}
            onDrag={onDragHandle}
            onDragOver={onDragOver}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onDragEnd={onDragEndHandle}
            draggable>
            {props.is_loading ? <Spinner />: <SpinnerPlaceholder />}
            <div className='checkbox'>
              <Form.Check
                key={props.node.id}
                onChange={onselect}
                checked={props.is_selected}
                type="checkbox" />
            </div>
            <TagsComponent tags={props.node.tags} max_items={3}/>
            <div className="body" onClick={onclick}>
              <div className="icon folder"></div>
            </div>
            <div className="footer">
              <div className="title" onClick={onclick}>{props.node.title}</div>
            </div>
          </div>
        </>
      );
    } else {
      return (
        <>
          <div key={props.node.id} ref={ref}
            className={css_class_node() + " " + cssAcceptFilesAndNodes}
            onDragStart={onDragStartHandle}
            onDrag={onDragHandle}
            onDragOver={onDragOver}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onDragEnd={onDragEndHandle}
            draggable>
              <Form.Check
                key={props.node.id}
                onChange={onselect}
                checked={props.is_selected}
                type="checkbox" />
              {props.is_loading ? <Spinner />: <SpinnerPlaceholder />}
              <div className="body" onClick={onclick}>
                <div className="icon folder"></div>
              </div>
              <div className="title" onClick={onclick}>{props.node.title}</div>
              <TagsComponent tags={props.node.tags} max_items={4}/>
          </div>
        </>
      );
    }
  }
);

export default Folder;
