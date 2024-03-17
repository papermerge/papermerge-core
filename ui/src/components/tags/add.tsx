
import {useState, ChangeEvent} from 'react';
import { Form, Button } from "react-bootstrap";

import LoadingButton from 'components/loading_button';
import { DEFAULT_TAG_FG_COLOR, DEFAULT_TAG_BG_COLOR } from 'cconstants';
import { fetcher_post } from 'utils/fetcher';
import useToast from 'hooks/useToasts';


import TagComponent from "./tag";
import { IColoredTag } from "types";
import type { ColoredTag as ColoredTagWithID }  from 'types';


class ColoredTag implements IColoredTag {
  name: string = '';
  description: string = '';
  fg_color: string = DEFAULT_TAG_FG_COLOR;
  bg_color: string = DEFAULT_TAG_BG_COLOR;
  pinned: boolean = false;

  static from(tag: IColoredTag): IColoredTag {
    let result: IColoredTag = new ColoredTag();

    result.bg_color = tag.bg_color;
    result.fg_color = tag.fg_color;
    result.pinned = tag.pinned;
    result.name = tag.name;
    result.description = result.description;

    return result;
  }
}


type Args = {
  onSave: (item: ColoredTagWithID) => void;
  onCancel: () => void;
}


export default function AddRow({onSave, onCancel}: Args) {
  const [controller, setController] = useState<AbortController>(new AbortController());
  const [item, setItem] = useState<IColoredTag>(new ColoredTag());
  const [save_in_progress, setSaveInProgress] = useState(false);
  const toasts = useToast();

  const onChangeName = (event: ChangeEvent<HTMLInputElement>) => {
    let value = event.currentTarget.value;
    let new_item =  ColoredTag.from(item);

    new_item.name = value;

    setItem(new_item);
  }

  const onChangeBgColor = (event: ChangeEvent<HTMLInputElement>) => {
    let value = event.currentTarget.value;
    let new_item: IColoredTag =  ColoredTag.from(item);

    new_item.bg_color = value;

    setItem(new_item);
  }

  const onChangeFgColor = (event: ChangeEvent<HTMLInputElement>) => {
    let value = event.currentTarget.value;
    let new_item: IColoredTag =  ColoredTag.from(item);

    new_item.fg_color = value;

    setItem(new_item);
  }

  const onLocalSaveHandler = () => {
    if (!save_in_progress) {
      setSaveInProgress(true);

      fetcher_post<ColoredTag, ColoredTagWithID>(
        `/api/tags/`,
        item,
        controller.signal
      ).then((new_item: ColoredTagWithID) => {
        setSaveInProgress(false);
        setController(new AbortController());
        onSave(new_item);
      }).catch((error: Error) => {
        setSaveInProgress(false);
        toasts?.addToast("error", `Error while creating tag: ${error.toString()}`);
      });
    }
  }

  const onCancelLocalHandler = () => {
    onCancel();
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
        <a href='#' className="m-1">
          <LoadingButton
            title='Save'
            className='flat'
            in_progress={save_in_progress}
            onClick={onLocalSaveHandler} />
        </a>
      </div>
    </div>
  );
}
