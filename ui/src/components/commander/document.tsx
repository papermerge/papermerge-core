import { useEffect, useState } from "react";

import Spinner from "../spinner";
import SpinnerPlaceholder from "../spinner_placeholder";
import OcrStatus from "components/ocr_status";
import Form from 'react-bootstrap/Form';
import websockets from "../../services/ws";

import type { CheckboxChangeType, NodeArgsType } from "./types";
import { OcrStatusEnum } from "types";


function str_id(node_id: string): string {
  return `document-ocr-status-${node_id}`;
}


function Document({node, onClick, onSelect, is_loading, is_selected}: NodeArgsType) {

  const [ status, setStatus ] = useState<OcrStatusEnum>("UNKNOWN");

  const networkMessageHandler = (data: any, ev: MessageEvent) => {
    if (data.document_id == node.id) {
      switch(data.type) {
        case "ocrdocumenttask.taskreceived":
          setStatus("RECEIVED");
          break;
        case "ocrdocumenttask.taskstarted":
          setStatus("STARTED");
          break;
        case "ocrdocumenttask.tasksucceeded":
          setStatus("SUCCEEDED");
          break;
        case "ocrdocumenttask.taskfailed":
          setStatus("FAILED");
          break;
      }
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
      <OcrStatus status={status} />
      <div className="title" onClick={onclick}>{node.title}</div>
    </div>
  );
}

export default Document;
