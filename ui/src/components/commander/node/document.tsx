import { useEffect, useState } from "react";

import { useProtectedJpg } from "hooks/protected_image"
import Spinner from "../../spinner";
import SpinnerPlaceholder from "../../spinner_placeholder";
import OcrStatus from "components/ocr_status";
import Form from 'react-bootstrap/Form';
import websockets from "../../../services/ws";

import type { CheckboxChangeType, NodeArgsType } from "../types";
import { OcrStatusEnum } from "types";


function str_id(node_id: string): string {
  return `document-ocr-status-${node_id}`;
}


function Document({node, onClick, onSelect, is_loading, is_selected}: NodeArgsType) {

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

  console.log(`NODE ID=${node.id}`);
  console.log(`node.document.thumbnail_url=${node.document?.thumbnail_url}`);

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
    thumbnail_component = <div>
      {protected_thumbnail.data}
    </div>
  }

  return (
    <div className="node document" draggable>
      {is_loading ? <Spinner />: <SpinnerPlaceholder />}
      <div><Form.Check onChange={onselect} defaultChecked={is_selected} type="checkbox" /></div>
      {thumbnail_component}
      <OcrStatus status={status} />
      <div className="title" onClick={onclick}>{node.title}</div>
    </div>
  );
}

export default Document;
