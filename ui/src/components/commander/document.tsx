import { useEffect } from "react";

import Spinner from "../spinner";
import SpinnerPlaceholder from "../spinner_placeholder";
import Form from 'react-bootstrap/Form';
import websockets from "../../services/ws";

import type { CheckboxChangeType, NodeArgsType } from "./types";


function str_id(node_id: string): string {
  return `document-ocr-status-${node_id}`;
}


function Document({node, onClick, onSelect, is_loading, is_selected}: NodeArgsType) {

  const networkMessageHandler = (data: any, ev: MessageEvent) => {
    console.log(`I received a message`);
    console.log(`Is message for me? ${data.document_id} == ${node.id}`);
    if (data.document_id == node.id) {
      console.log(data.type);
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

  return (
    <div className="node document" draggable>
      {is_loading ? <Spinner />: <SpinnerPlaceholder />}
      <div><Form.Check onChange={onselect} defaultChecked={is_selected} type="checkbox" /></div>
      <div className="icon document"></div>
      <div className="title" onClick={onclick}>{node.title}</div>
    </div>
  );
}

export default Document;