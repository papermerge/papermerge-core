import Spinner from "../spinner";
import SpinnerPlaceholder from "../spinner_placeholder";
import Form from 'react-bootstrap/Form';

import type { CheckboxChangeType, NodeArgsType } from "./types";


function Document({node, onClick, onSelect, is_loading, is_selected}: NodeArgsType) {

  const onclick = () => {
    onClick(node.id);
  }

  const onselect = (event: CheckboxChangeType) => {
    onSelect(node.id, event.target.checked);
  }

  return (
    <div className="node document">
      {is_loading ? <Spinner />: <SpinnerPlaceholder />}
      <div><Form.Check onChange={onselect} defaultChecked={is_selected} type="checkbox" /></div>
      <div className="icon document"></div>
      <div className="title" onClick={onclick}>{node.title}</div>
    </div>
  );
}

export default Document;