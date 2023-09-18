import { useState } from "react";
import { useProtectedJpg } from "hooks/protected_image"

import ThumbnailPlaceholder from './thumbnail_placeholder';
import { PAGE_ID } from "./constants";
import type { PageType } from "types"


type Args = {
  page: PageType,
  onClick: (page: PageType) => void;
  onDrag: (page: PageType) => void;
}

export function PageThumbnail({page, onClick, onDrag}: Args) {

  const [pageIsDragged, setPageIsDragged] = useState<boolean>(false);
  let thumbnail_css_class = 'd-flex flex-column p-2 m-2 page pb-0';

  if (!page.jpg_url) {
    return <ThumbnailPlaceholder />;
  }

  const {is_loading, data, error} = useProtectedJpg(page.jpg_url);
  let thumbnail_component: JSX.Element | null;

  const localOnClick = () => {
    onClick(page);
  }

  const onLocalDrag = () => {
    onDrag(page);
    setPageIsDragged(true);
  }

  const onLocalDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData(PAGE_ID, page.id);
    setPageIsDragged(true);
  }

  const onLocalDragEnd = () => {
    setPageIsDragged(false);
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
      onClick={localOnClick}>
      <div>
        {data}
      </div>
      <div className='p-1 page-number text-center'>
        {page.number}
      </div>
    </div>
  }

  if (pageIsDragged) {
    thumbnail_css_class = 'd-flex flex-column p-2 m-2 page pb-0 dragged';
  } else {
    thumbnail_css_class = 'd-flex flex-column p-2 m-2 page pb-0';
  }

  return <div
    className={thumbnail_css_class}>
    {thumbnail_component}
  </div>
}
