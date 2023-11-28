import { useState } from "react";
import { Page }  from "./page";
import Zoom from "components/viewer/Zoom";
import type { PageAndRotOp, Vow } from "types"



type Args = {
  items: Vow<Array<PageAndRotOp>>;
  current_page_number: number;
}

const MAX_ZOOM = 300;
const MIN_ZOOM = 20;
const ZOOM_STEP = 10;
const ZOOM_FIT = 100;



export function PagesPanel({items, current_page_number}: Args) {
  let [zoom, setZoom] = useState<number>(ZOOM_FIT);

  const onZoomIn = () => {
    if (zoom < MAX_ZOOM) {
      setZoom(zoom + ZOOM_STEP)
    }
  }

  const onZoomOut = () => {
    if (zoom > MIN_ZOOM) {
      setZoom(zoom - ZOOM_STEP)
    }
  }

  const onZoomFit = () => {
    setZoom(ZOOM_FIT);
  }

  if (items.is_pending) {
    return <div className='pages-panel flex-grow-1'>
      pending...
    </div>
  }

  if (items.error) {
    return <div>Error loading pages</div>
  }

  if (!items.data) {
    return <div>Pages panel received empty data</div>
  }

  return (
    <div className="flex-grow-1">
      <div className='pages-panel'>
        {items.data.map(item => <Page
              key={item.page.id}
              zoom={zoom}
              item={item}
              scroll_into_view={item.page.number == current_page_number}/>)}
      </div>
      <Zoom
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onZoomFit={onZoomFit} />
    </div>
  );
}
