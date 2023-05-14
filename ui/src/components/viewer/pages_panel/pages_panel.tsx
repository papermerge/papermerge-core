import { Page }  from "./page";
import type { PageType } from "@/types"

type Args = {
  pages: Array<PageType>;
}

export function PagesPanel({pages}: Args) {
  return (
    <div className='pages-panel flex-grow-1'>
      {pages.map(page => <Page page={page} />)}
    </div>
  );
}