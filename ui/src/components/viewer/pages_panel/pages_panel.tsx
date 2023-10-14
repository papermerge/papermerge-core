import { Page }  from "./page";
import type { PageAndRotOp, Vow } from "types"


type Args = {
  items: Vow<Array<PageAndRotOp>>;
  current_page_number: number;
}


export function PagesPanel({items, current_page_number}: Args) {

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
    <div className='pages-panel flex-grow-1'>
      {items.data.map(item => <Page
            key={item.page.id}
            item={item}
            scroll_into_view={item.page.number == current_page_number}/>)}
    </div>
  );
}
