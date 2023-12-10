import { forwardRef, useState, useEffect } from 'react';

import Spinner from "../../spinner";
import SpinnerPlaceholder from "../../spinner_placeholder";
import Form from 'react-bootstrap/Form';

import type { NodeType, NType } from 'types';
import type { CheckboxChangeType } from "../types";
import { DisplayNodesModeEnum } from "types";
import TagsComponent from './tags';
import { truncatechars} from './utils';
import { OverlayTrigger } from "react-bootstrap";
import Tooltip from 'react-bootstrap/Tooltip';


type FolderArgsType = {
  node: NodeType;
  onClick: (node: NType) => void;
  onSelect: (node_id: string, selected: boolean) => void;
  onDragStart: (node_id: string, event: React.DragEvent) => void;
  onDrag: (node_id: string, event: React.DragEvent) => void;
  onDropNodesToSpecificFolder: (node_id: string, event: React.DragEvent) => void;
  is_loading: boolean;
  is_selected: boolean;
  is_being_dragged: boolean;
  display_mode: DisplayNodesModeEnum;
}


const ACCEPT_DROPPED_NODES = "accept_dropped_nodes";


const Folder = forwardRef<HTMLDivElement, FolderArgsType>(
  (props, ref) => {
    const onclick = () => {
      props.onClick({
        id: props.node.id,
        ctype: props.node.ctype
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

    const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
      setCssAcceptFilesAndNodes(ACCEPT_DROPPED_NODES);
    }

    const onDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
      setCssAcceptFilesAndNodes(ACCEPT_DROPPED_NODES);
    }

    const onDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
      setCssAcceptFilesAndNodes("");
    }

    const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
      // signals that element wants to handle `drop` event
      event.preventDefault();
      // without `event.stopPropagation`, the `drop` event will
      // be fired twice: once for this folder and once for its parent
      event.stopPropagation();  // ! Important

      setCssAcceptFilesAndNodes(""); // remove selection
      props.onDropNodesToSpecificFolder(props.node.id, event);
    }

    const css_class_node = (): string => {
      let css_class: string = '';

      if (props.display_mode == DisplayNodesModeEnum.Tiles) {
        css_class = 'node folder tile';
      } else {
        css_class = 'node folder list';
      }

      if (props.is_being_dragged) {
        css_class += ' dragged ';
      }

      return css_class;
    }

    useEffect(() => {
      css_class_node();
    }, [props.is_being_dragged]);

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
              <div className="title" onClick={onclick}>
                <OverlayTrigger
                  placement={'right'}
                  delay={2000}
                  overlay={<Tooltip>{props.node.title}</Tooltip>}>
                    <div>{truncatechars(props.node.title)}</div>
                </OverlayTrigger>
              </div>
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
