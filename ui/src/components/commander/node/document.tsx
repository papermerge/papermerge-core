import { useEffect, useState } from "react";

import { useProtectedJpg } from "hooks/protected_image"
import Spinner from "../../spinner";
import SpinnerPlaceholder from "../../spinner_placeholder";
import OcrStatus from "components/ocr_status";
import Form from 'react-bootstrap/Form';
import websockets from "../../../services/ws";

import TagsComponent from './tags';
import type { CheckboxChangeType, NodeArgsType } from "../types";
import { DisplayNodesModeEnum, OcrStatusEnum } from "types";


function str_id(node_id: string): string {
  return `document-ocr-status-${node_id}`;
}


function Document({
  node,
  onClick,
  onSelect,
  is_loading,
  is_selected,
  display_mode
}: NodeArgsType) {

  const [ status, setStatus ] = useState<OcrStatusEnum>(node?.document?.ocr_status || "UNKNOWN");
  const protected_thumbnail = useProtectedJpg(node?.thumbnail_url || node?.document?.thumbnail_url || null);
  let thumbnail_component: JSX.Element | null;

  const networkMessageHandler = (data: any, ev: MessageEvent) => {
    console.log(data);

    console.log(`node_id=${node.id}  incoming document_id=${data.kwargs.document_id}`);
    if (data.kwargs.document_id == node.id) {
      console.log('setting state');
      setStatus(data.state);
    }
  }

  useEffect(() => {
    websockets.addHandler(str_id(node.id), {callback: networkMessageHandler});

    return () => {
      websockets.removeHandler(str_id(node.id));
    }
  }, []);

  const onclick = () => {
    onClick({node_id: node.id, node_type: node.ctype});
  }

  const onselect = (event: CheckboxChangeType) => {
    onSelect(node.id, event.target.checked);
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

  if (display_mode == DisplayNodesModeEnum.Tiles) {
    return (
      <div className="node document tile" draggable>
        <div className='checkbox'>
            <Form.Check onChange={onselect} checked={is_selected} type="checkbox" />
        </div>
        <TagsComponent tags={node.tags} max_items={4}/>
        <div className="body" onClick={onclick}>
          {is_loading ? <Spinner />: <SpinnerPlaceholder />}
          {thumbnail_component}
        </div>
        <div className="footer d-flex">
          <OcrStatus status={status} />
          <div className="title" onClick={onclick}>{node.title}</div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="node document list" draggable>
        <div className='checkbox'>
            <Form.Check onChange={onselect} checked={is_selected} type="checkbox" />
        </div>
        {is_loading ? <Spinner />: <SpinnerPlaceholder />}
        <div className="body" onClick={onclick}>
          {thumbnail_component}
        </div>
        <div className="title" onClick={onclick}>{node.title}</div>
        <div className="ocr">
          <OcrStatus status={status} />
        </div>
        <TagsComponent tags={node.tags} max_items={4}/>
      </div>
    );
  }

}

export default Document;
