import { useState, useRef } from "react";
import { useProtectedJpg } from "hooks/protected_image"
import Form from 'react-bootstrap/Form';
import './page_thumbnail.scss';


import ThumbnailPlaceholder from './thumbnail_placeholder';
import { PAGE_ID } from "./constants";
import type {
  ThumbnailPageDroppedArgs,
  DroppedThumbnailPosition,
  PageAndRotOp
} from "types"
import { CheckboxChangeType } from "components/commander/types";


type Args = {
  item: PageAndRotOp;
  onSelect: (page_id: string, selected: boolean) => void;
  onClick: (page: PageAndRotOp) => void;
  onThumbnailPageDropped: (args: ThumbnailPageDroppedArgs) => void;
}


const BORDERLINE_TOP = 'borderline-top';
const BORDERLINE_BOTTOM = 'borderline-bottom';
const DRAGGED = 'dragged';


export function PageThumbnail({
  item,
  onClick,
  onThumbnailPageDropped,
  onSelect
}: Args) {

  const [cssClassNames, setCssClassNames] = useState<Array<string>>([
      'd-flex',
      'flex-column',
      'p-2',
      'm-2',
      'page',
      'pb-0',
      'page-thumbnail'
  ]);
  const ref = useRef<HTMLDivElement>(null);

  if (!item.page.jpg_url) {
    return <ThumbnailPlaceholder />;
  }

  const {is_loading, data, error} = useProtectedJpg(item.page.jpg_url);
  let thumbnail_component: JSX.Element | null;

  const localOnClick = () => {
    onClick(item);
  }

  const onLocalDrag = () => {
    if (cssClassNames.indexOf(DRAGGED) < 0) {
      setCssClassNames([
        ...cssClassNames, DRAGGED
      ]);
    }
  }

  const onLocalDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData(PAGE_ID, item.page.id);
    if (cssClassNames.indexOf(DRAGGED) < 0) {
      setCssClassNames([
        ...cssClassNames, DRAGGED
      ]);
    }
  }

  const onLocalDragEnd = () => {
    setCssClassNames(
      cssClassNames.filter(item => item !== DRAGGED)
    );
  }

  const onLocalDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    const y = event.clientY;

    event.preventDefault();

    if (ref?.current) {
      const rect = ref?.current.getBoundingClientRect();
      const half = (rect.bottom - rect.top) / 2;

      if (y >= rect.top && y < rect.top + half) {
        // remove borderline_bottom and add borderline_top
        const new_array = cssClassNames.filter(i => i != BORDERLINE_BOTTOM);

        if (new_array.indexOf(BORDERLINE_TOP) < 0) {
          setCssClassNames([
            ...new_array, BORDERLINE_TOP
          ]);
        }
      } else if (y >= rect.top + half && y < rect.bottom) {
        // remove borderline_top and add borderline_bottom
        const new_array = cssClassNames.filter(i => i != BORDERLINE_TOP);

        if (new_array.indexOf(BORDERLINE_BOTTOM) < 0) {
          setCssClassNames([
            ...new_array, BORDERLINE_BOTTOM
          ]);
        }
      }
    } // if (ref?.current)
  } // end of onLocalDragOver

  const onLocalDragLeave = () => {
    // remove both borderline_bottom and borderline_top
    const new_array = cssClassNames.filter(i => i != BORDERLINE_BOTTOM && i != BORDERLINE_TOP);
    setCssClassNames(
      new_array
    );
  }

  const onLocalDrop = (event: React.DragEvent<HTMLDivElement>) => {
    const source_page_id: string = event.dataTransfer.getData(PAGE_ID);
    const y = event.clientY;
    let position: DroppedThumbnailPosition = 'before';

    event.preventDefault();

    if (ref?.current) {
      const rect = ref?.current.getBoundingClientRect();
      const half = (rect.bottom - rect.top) / 2;

      if (y >= rect.top && y < rect.top + half) {
        // dropped over upper half of the page
        position = 'before';
      } else if (y >= rect.top + half && y < rect.bottom) {
        // dropped over lower half of the page
        position = 'after';
      }
      if (source_page_id != item.page.id) {
        onThumbnailPageDropped({
          source_id: source_page_id,
          target_id: item.page.id,
          position: position
        });
      } else {
        console.log('Page dropped onto itself');
      }
    } // if (ref?.current)

    // remove both borderline_bottom and borderline_top
    const new_array = cssClassNames.filter(i => i != BORDERLINE_BOTTOM && i != BORDERLINE_TOP);
    setCssClassNames(
      new_array
    );
  }

  const onLocalDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }

  const onLocalChange = (event: CheckboxChangeType) => {
    onSelect(item.page.id, event.target.checked);
  }

  if (is_loading) {
    thumbnail_component = <ThumbnailPlaceholder />;
  } else if ( error ) {
    thumbnail_component = <div>Error</div>
  } else {
    thumbnail_component = <div
      draggable
      onDrag={onLocalDrag}
      onDragStart={onLocalDragStart}
      onDragEnd={onLocalDragEnd}
      onDragOver={onLocalDragOver}
      onDragLeave={onLocalDragLeave}
      onDragEnter={onLocalDragEnter}
      onDrop={onLocalDrop}>
      <div className='checkbox'>
        <Form.Check onChange={onLocalChange} type="checkbox" />
      </div>
      <div onClick={localOnClick} style={{transform: `rotate(${item.angle}deg)`}}>
        {data}
      </div>
    </div>
  }

  return <div
    ref={ref}
    className={cssClassNames.join(' ')}>
    {thumbnail_component}
  </div>
}
