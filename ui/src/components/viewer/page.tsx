import PagePlaceholder from './page_placeholder';

import { useRef, useEffect } from 'react';
import type { PageType } from "@/types"
import { useProtectedSVG, useProtectedJpg } from "../../hooks/protected_image"
import Page_placeholder from './page_placeholder';

type Args = {
  page: PageType
}

export function Page({page}: Args) {

  //const base64_jpg = useProtectedJpg(page.jpg_url);

  let {data, is_loading, error} = useProtectedSVG(page.svg_url);
  let page_component: JSX.Element | null

  if (is_loading) {
    page_component = <PagePlaceholder />;
  } else if ( error ) {
    page_component = <div>Error</div>
  } else {
    page_component = <div>
      {data}
      <div className='p-2 mb-3 page-number text-center'>
        {page.number}
      </div>;
    </div>
  }

  return <div className='d-flex flex-column p-2 m-2 page pb-0'>
    {page_component}
  </div>
}
