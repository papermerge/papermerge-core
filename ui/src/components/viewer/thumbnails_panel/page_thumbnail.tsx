import { useState, useRef, useEffect } from "react";
import { useProtectedSVG } from "hooks/protected_image"
import Form from 'react-bootstrap/Form';
import './page_thumbnail.scss';


import ThumbnailPlaceholder from './thumbnail_placeholder';
import { DATA_TRANSFER_EXTRACTED_PAGES } from "cconstants";
import type {
  ThumbnailPageDroppedArgs,
  DroppedThumbnailPosition,
  PageAndRotOp,
  DataTransferExtractedPages
} from "types"
import { CheckboxChangeType } from "components/commander/types";


type Args = {
  item: PageAndRotOp;
  onSelect: (page_id: string, selected: boolean) => void;
  onClick: (page: PageAndRotOp) => void;
  onDragStart: (page: PageAndRotOp, event: React.DragEvent) => void;
  onDrag: (page: PageAndRotOp, event: React.DragEvent) => void;
  onDragEnd: (page: PageAndRotOp, event: React.DragEvent) => void;
  onThumbnailPageDropped: (args: ThumbnailPageDroppedArgs) => void;
  is_dragged: boolean;
}


const BORDERLINE_TOP = 'borderline-top';
const BORDERLINE_BOTTOM = 'borderline-bottom';
const DRAGGED = 'dragged';


export function PageThumbnail({
  item,
  onClick,
  onThumbnailPageDropped,
  onDragStart,
  onDrag,
  onDragEnd,
  onSelect,
  is_dragged
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

  const {is_loading, data, error} = useProtectedSVG(
    item.page.svg_url,
    item.page.jpg_url,
  );
  let thumbnail_component: JSX.Element | null;

  const localOnClick = () => {
    onClick(item);
  }

  useEffect(() => {
    if (is_dragged) {
      if (cssClassNames.indexOf(DRAGGED) < 0) {
        setCssClassNames([
          ...cssClassNames, DRAGGED
        ]);
      }
    } else { // i.e. is not dragged
      setCssClassNames( // remove css class
        cssClassNames.filter(item => item !== DRAGGED)
      );
    }
  }, [is_dragged]);

  const onLocalDrag = (event: React.DragEvent<HTMLDivElement>) => {
    onDrag(item, event);
  }

  const onLocalDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    onDragStart(item, event);
  }

  const onLocalDragEnd = (event: React.DragEvent<HTMLDivElement>) => {
    onDragEnd(item, event);
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
    const data = event.dataTransfer.getData(DATA_TRANSFER_EXTRACTED_PAGES);
    const y = event.clientY;
    let position: DroppedThumbnailPosition = 'before';

    if (!data) {
      console.warn("No data found when processing dropped thumbnail page");
      return;
    }

    event.preventDefault();
    const _data = JSON.parse(data) as DataTransferExtractedPages;

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

      onThumbnailPageDropped({
        source_ids: _data.pages,
        target_id: item.page.id,
        position: position
      });
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
