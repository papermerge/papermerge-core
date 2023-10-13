import { useEffect, useState, forwardRef } from "react";

import { useProtectedJpg } from "hooks/protected_image"
import Spinner from "../../spinner";
import SpinnerPlaceholder from "../../spinner_placeholder";
import OcrStatus from "components/ocr_status";
import Form from 'react-bootstrap/Form';
import websockets from "../../../services/ws";

import TagsComponent from './tags';
import type { CheckboxChangeType, NodeArgsType } from "../types";
import { DisplayNodesModeEnum, OcrStatusEnum } from "types";
import "./document.scss";


function str_id(node_id: string): string {
  return `document-ocr-status-${node_id}`;
}


const Document = forwardRef<HTMLDivElement, NodeArgsType>(
  (props, ref) => {

  const [ status, setStatus ] = useState<OcrStatusEnum>(props.node?.document?.ocr_status || "UNKNOWN");
  const protected_thumbnail = useProtectedJpg(`/api/thumbnails/${props.node.id}`);
  let thumbnail_component: JSX.Element | null;

  const networkMessageHandler = (data: any, ev: MessageEvent) => {
    if (data.kwargs.document_id == props.node.id) {
      setStatus(data.state);
    }
  }

  useEffect(() => {
    websockets.addHandler(str_id(props.node.id), {callback: networkMessageHandler});

    return () => {
      websockets.removeHandler(str_id(props.node.id));
    }
  }, []);

  const onclick = () => {
    props.onClick({id: props.node.id, ctype: props.node.ctype});
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

  if (protected_thumbnail.is_loading) {
    thumbnail_component = <div className="icon document"></div>;
  } else if ( protected_thumbnail.error ) {
    thumbnail_component = <div>{protected_thumbnail.error}</div>
  } else {
    thumbnail_component = <div className="image">
      {protected_thumbnail.data}
    </div>
  }

  if (props.display_mode == DisplayNodesModeEnum.Tiles) {
    return (
      <div
        className="node document tile"
        draggable
        ref={ref}
        key={props.node.id}
        onDragStart={onDragStartHandle}
        onDrag={onDragHandle}>
        <div className='checkbox'>
            <Form.Check onChange={onselect} checked={props.is_selected} type="checkbox" />
        </div>
        <TagsComponent tags={props.node.tags} max_items={4}/>
        <div className="body" onClick={onclick}>
          {props.is_loading ? <Spinner />: <SpinnerPlaceholder />}
          {thumbnail_component}
        </div>
        <div className="footer d-flex">
          <OcrStatus status={status} />
          <div className="title" onClick={onclick}>{props.node.title}</div>
        </div>
      </div>
    );
  } else {
    return (
      <div
        className="node document list"
        draggable
        ref={ref}
        key={props.node.id}
        onDragStart={onDragStartHandle}
        onDrag={onDragHandle}>
        <div className='checkbox'>
            <Form.Check onChange={onselect} checked={props.is_selected} type="checkbox" />
        </div>
        {props.is_loading ? <Spinner />: <SpinnerPlaceholder />}
        <div className="body" onClick={onclick}>
          {thumbnail_component}
        </div>
        <div className="title" onClick={onclick}>{props.node.title}</div>
        <div className="ocr">
          <OcrStatus status={status} />
        </div>
        <TagsComponent tags={props.node.tags} max_items={4}/>
      </div>
    );
  }
  }
);

export default Document;
