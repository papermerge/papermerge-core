import { useProtectedJpg } from "hooks/protected_image"

import ThumbnailPlaceholder from './thumbnail_placeholder';

import type { PageType } from "types"


type Args = {
  page: PageType
}

export function PageThumbnail({page}: Args) {

  const {is_loading, data, error} = useProtectedJpg(page.jpg_url);
  let thumbnail_component: JSX.Element | null;

  if (is_loading) {
    thumbnail_component = <ThumbnailPlaceholder />;
  } else if ( error ) {
    thumbnail_component = <div>Error</div>
  } else {
    thumbnail_component = <div>
      {data}
      <div className='p-2 mb-3 page-number text-center'>
        {page.number}
      </div>;
    </div>
  }

  return <div className='d-flex flex-column p-2 m-2 page pb-0'>
    {thumbnail_component}
  </div>
}

