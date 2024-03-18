import { useState, ChangeEvent } from 'react';
import Form from 'react-bootstrap/Form';
import { Button } from 'react-bootstrap';
import type { ColoredTag } from "types";
import LoadingButton from 'components/loading_button';
import { fetcher_delete, fetcher_patch } from "utils/fetcher";
import useToast from 'hooks/useToasts';

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
  const [controller, setController] = useState<AbortController>(new AbortController());
  const [updated_item, updateItem] = useState<ColoredTag>(item);
  const [save_in_progress, setSaveInProgress] = useState(false);
  const toasts = useToast();

  const onChangeName = (event: ChangeEvent<HTMLInputElement>) => {
    let value = event.currentTarget.value;

    updateItem({
      'id': updated_item.id,
      'name': value,
      'bg_color': updated_item.bg_color,
      'fg_color': updated_item.fg_color,
      'pinned': updated_item.pinned,
      'description': updated_item.description,
    });
  }

  const onCancelLocalHandler = () => {
    updateItem(item); // reset tag to initial state
    onCancel();
  }

  const onChangeBgColor = (event: ChangeEvent<HTMLInputElement>) => {
    let value = event.currentTarget.value;

    updateItem({
      'id': updated_item.id,
      'name': updated_item.name,
      'bg_color': value,
      'fg_color': updated_item.fg_color,
      'pinned': updated_item.pinned,
      'description': updated_item.description,
    });
  }

  const onChangeFgColor = (event: ChangeEvent<HTMLInputElement>) => {
    let value = event.currentTarget.value;

    updateItem({
      'id': updated_item.id,
      'name': updated_item.name,
      'bg_color': updated_item.bg_color,
      'fg_color': value,
      'pinned': updated_item.pinned,
      'description': updated_item.description,
    });
  }

  const onLocalUpdateHandler = () => {
    setSaveInProgress(true);

    fetcher_patch<ColoredTag, ColoredTag>(
      `/api/tags/${updated_item.id}`,
      updated_item,
      controller.signal
    ).then(() => {
      setSaveInProgress(false);
      setController(new AbortController());
      onUpdate(updated_item);
    }).catch((error: Error) => {
      setSaveInProgress(false);
      toasts?.addToast("error", `Error while updating tag: ${error.toString()}`);
    });
  }

  const onLocalRemoveHandler = () => {
    fetcher_delete<Object, Response>(
      `/api/tags/${item.id}`,
      {},
      undefined,
      false
    ).then((res) => {
      if (res.status == 401) {
        setSaveInProgress(false);
        toasts?.addToast("error", `Error while deleting tag: 401 Unauthorized`);
      } else {
        onRemove(item);
      }
    }).catch((error: Error) => {
      setSaveInProgress(false);
      toasts?.addToast("error", `Error while deleting tag: ${error.toString()}`);
    });
  }

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
          <a href='#' onClick={onLocalRemoveHandler} className="m-1">
            Remove
          </a>
        </td>
      </tr>
    );
  }
  // edit mode from here on

  return (
    <tr>
      <td className="text-left">
        <Tag item={updated_item} />
        <Form.Control
          className='my-1'
          onChange={onChangeName}
          value={updated_item.name} />
        <div className='d-flex'>
          <Form.Control
            type='color'
            onChange={onChangeBgColor}
            value={updated_item.bg_color} />
          <Form.Control
            type='color'
            onChange={onChangeFgColor}
            value={updated_item.fg_color} />
        </div>
      </td>
      <td className="text-center">
        <Form.Check type='checkbox' />
      </td>
      <td className="text-center">
        <Form.Control />
      </td>
      <td className="text-center">
        <a href='#' onClick={() => onCancelLocalHandler()} className="m-1">
          <Button variant='secondary' className='flat'>Cancel</Button>
        </a>
        <a href='#' onClick={() => onLocalUpdateHandler()} className="m-1">
          <LoadingButton
            title='Save'
            className='flat'
            in_progress={save_in_progress}
            onClick={onLocalUpdateHandler} />
        </a>
      </td>
    </tr>
  );
}
