import { useRef } from 'react';
import PagePlaceholder from './page_placeholder';

import type { PageType } from "types"
import { useProtectedSVG } from "hooks/protected_image"

type Args = {
  page: PageType;
  /*
    if `scroll_into_view`=True -> page should be scrolled into the view.

    `scroll_into_view` flag is controlled by thumbnails page; when user clicks
    on specific thumbnail, that page should be scrolled into the visible
    view.
  */
  scroll_into_view: boolean;
}

function get_page_panel_width(): number {
  let element = document.querySelector('.pages-panel'),
    rect,
    ret: number;

  if (!element) {
    console.warn(".pages-panel element not found, fall back to 900px");
    return 900;
  }

  rect = element.getBoundingClientRect();

  ret = Math.floor(rect.width);

  return ret;
}

export function Page({page, scroll_into_view}: Args) {

  //const base64_jpg = useProtectedJpg(page.jpg_url);
  const pageRef = useRef<HTMLDivElement | null>(null);

  let {data, is_loading, error} = useProtectedSVG(
    page.svg_url,
    `${page.jpg_url}?size=${get_page_panel_width()}`
  );
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
      </div>
    </div>
  }

  if(scroll_into_view) {
    const node: HTMLDivElement | null = pageRef?.current;

    if (node) {
      node.scrollIntoView();
    }
  }

  return <div ref={pageRef} className='d-flex flex-column p-2 m-2 page pb-0'>
    {page_component}
  </div>
}
