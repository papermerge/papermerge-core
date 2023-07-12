import Form from 'react-bootstrap/Form';
import { Button } from 'react-bootstrap';
import type { ColoredTag } from "types";

import Tag from "./tag";

type Args = {
  item: ColoredTag;
  onSwitchEditMode: (item: ColoredTag) => void;
  onRemove: (item: ColoredTag) => void;
  onCancel: () => void;
  onUpdate: (item: ColoredTag) => void;
  edit_mode: boolean;
}

function XIcon() {
  return <h3><i className="bi bi-x text-danger"></i></h3>;
}


function CheckIcon() {
  return <h3><i className='bi bi-check text-success'></i></h3>;
};


export default function Row({
  item,
  onSwitchEditMode,
  onRemove,
  edit_mode,
  onCancel,
  onUpdate
}: Args) {

  if (!edit_mode) {
    return (
      <tr>
        <td className="text-left">
          <Tag item={item} />
        </td>
        <td className="text-center">
          {item.pinned ? <CheckIcon /> : <XIcon />}
        </td>
        <td className="text-center">
          {item.description}
        </td>
        <td className="text-center">
          <a href='#' onClick={() => onSwitchEditMode(item)} className="m-1">
            Edit
          </a>
          <a href='#' onClick={() => onRemove(item)} className="m-1">
            Remove
          </a>
        </td>
      </tr>
    );
  }

  return (
    <tr>
        <td className="text-left">
          <Tag item={item} />
          <Form.Control className='my-1' value={item.name} />
          <div className='d-flex'>
            <Form.Control type='color' value={item.bg_color} />
            <Form.Control type='color' value={item.fg_color} />
          </div>
        </td>
        <td className="text-center">
          <Form.Check type='checkbox' />
        </td>
        <td className="text-center">
          <Form.Control />
        </td>
        <td className="text-center">
          <a href='#' onClick={() => onCancel()} className="m-1">
            <Button variant='secondary' className='flat'>Cancel</Button>
          </a>
          <a href='#' onClick={() => onUpdate(item)} className="m-1">
            <Button variant='success' className='flat'>Save</Button>
          </a>
        </td>
    </tr>
  );
}
