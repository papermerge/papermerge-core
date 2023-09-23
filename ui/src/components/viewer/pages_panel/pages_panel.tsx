import { Page }  from "./page";
import type { PageAndRotOp } from "types"

type Args = {
  items: Array<PageAndRotOp>;
  current_page_number: number;
}

export function PagesPanel({items, current_page_number}: Args) {
  return (
    <div className='pages-panel flex-grow-1'>
      {items.map(item => <Page
            key={item.page.id}
            item={item}
            scroll_into_view={item.page.number == current_page_number}/>)}
    </div>
  );
}
