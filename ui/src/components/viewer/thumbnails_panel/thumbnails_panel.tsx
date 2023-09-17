import type { PageType } from "types"
import { PageThumbnail } from "./page_thumbnail";


type Args = {
  pages: Array<PageType>;
  visible: boolean;
  onClick: (page: PageType) => void;
}

export function ThumbnailsPanel({pages, visible, onClick}: Args) {

  let css_class_nanme = 'thumbnails-panel';

  if (!visible) {
    css_class_nanme += ' hidden';
  }

  return (
    <div className={css_class_nanme}>
      {pages.map(page => <PageThumbnail key={page.id} page={page} onClick={onClick} />)}
    </div>
  );
}
