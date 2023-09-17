import { useProtectedJpg } from "hooks/protected_image"

import ThumbnailPlaceholder from './thumbnail_placeholder';

import type { PageType } from "types"


type Args = {
  page: PageType,
  onClick: (page: PageType) => void;
}

export function PageThumbnail({page, onClick}: Args) {

  if (!page.jpg_url) {
    return <ThumbnailPlaceholder />;
  }

  const {is_loading, data, error} = useProtectedJpg(page.jpg_url);
  let thumbnail_component: JSX.Element | null;

  const localOnClick = () => {
    onClick(page);
  }

  if (is_loading) {
    thumbnail_component = <ThumbnailPlaceholder />;
  } else if ( error ) {
    thumbnail_component = <div>Error</div>
  } else {
    thumbnail_component = <div onClick={localOnClick}>
      <div>
        {data}
      </div>
      <div className='p-1 page-number text-center'>
        {page.number}
      </div>
    </div>
  }

  return <div className='d-flex flex-column p-2 m-2 page pb-0'>
    {thumbnail_component}
  </div>
}
