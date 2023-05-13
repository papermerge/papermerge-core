import type { PageType } from "@/types"
import { PageThumbnail } from "./page_thumbnail";


type Args = {
  pages: Array<PageType>;
}

export function ThumbnailsPanel({pages}: Args) {
  return (
    <div className='thumbnails-panel'>
      {pages.map(page => <PageThumbnail page={page} />)}
    </div>
  );
}