import { Page }  from "./page";
import type { PageType } from "types"

type Args = {
  pages: Array<PageType>;
  current_page_number: number;
}

export function PagesPanel({pages, current_page_number}: Args) {
  return (
    <div className='pages-panel flex-grow-1'>
      {pages.map(page => <Page
            key={page.id}
            page={page}
            scroll_into_view={page.number == current_page_number}/>)}
    </div>
  );
}
