import Spinner from "../spinner";
import SpinnerPlaceholder from "../spinner_placeholder";
import Form from 'react-bootstrap/Form';

import type { CheckboxChangeType, NodeArgsType } from "./types";


function Folder({node, onClick, onSelect, is_loading, is_selected}: NodeArgsType) {

  const onclick = () => {
    onClick(node.id);
  }

  const onselect = (event: CheckboxChangeType) => {
    onSelect(node.id, event.target.checked);
  }

  return (
    <>
      <div key={node.id} className="node folder">
        {is_loading ? <Spinner />: <SpinnerPlaceholder />}
        <div><Form.Check key={node.id} onChange={onselect} defaultChecked={is_selected} type="checkbox" /></div>
        <div className="icon folder"></div>
        <div className="title" onClick={onclick}>{node.title}</div>
      </div>
    </>
  );
}

export default Folder;