
import {useState, ChangeEvent} from 'react';
import { Form, Button } from "react-bootstrap";

import LoadingButton from 'components/loading_button';
import { DEFAULT_TAG_FG_COLOR, DEFAULT_TAG_BG_COLOR } from 'cconstants';


import TagComponent from "./tag";
import { IColoredTag } from "types";


class ColoredTag implements IColoredTag {
  name: string = '';
  description: string = '';
  fg_color: string = DEFAULT_TAG_FG_COLOR;
  bg_color: string = DEFAULT_TAG_BG_COLOR;
  pinned: boolean = false;
}


export default function AddRow() {
  const [item, setItem] = useState<IColoredTag>(new ColoredTag());
  const [save_in_progress, setSaveInProgress] = useState(false);

  const onChangeName = (event: ChangeEvent<HTMLInputElement>) => {
    let value = event.currentTarget.value;
    item.name = value;
    setItem({
      'name': value,
      'bg_color': item.bg_color,
      'fg_color': item.fg_color,
      'pinned': item.pinned,
      'description': item.description,
    });
  }

  const onChangeBgColor = (event: ChangeEvent<HTMLInputElement>) => {
    let value = event.currentTarget.value;
  }

  const onChangeFgColor = (event: ChangeEvent<HTMLInputElement>) => {
    let value = event.currentTarget.value;
  }

  const onLocalUpdateHandler = () => {
  }

  const onCancelLocalHandler = () => {
  }

  return (
    <div className='d-flex align-items-center my-2'>
      <div className="text-left">
        <TagComponent item={item} />
        <Form.Control
          className='my-1'
          onChange={onChangeName}
          value={item.name} />
        <div className='d-flex'>
          <Form.Control
            type='color'
            onChange={onChangeBgColor}
            value={item.bg_color} />
          <Form.Control
            type='color'
            onChange={onChangeFgColor}
            value={item.fg_color} />
        </div>
      </div>
      <div className="text-center">
        <Form.Check type='checkbox' />
      </div>
      <div className="text-center">
        <Form.Control />
      </div>
      <div className="text-center">
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
      </div>
    </div>
  );
}
