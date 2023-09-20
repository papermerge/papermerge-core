import type { PageType, ThumbnailPageDroppedArgs } from "types"
import { PageThumbnail } from "./page_thumbnail";


type Args = {
  pages: Array<PageType>;
  visible: boolean;
  onClick: (page: PageType) => void;
  onThumbnailPageDropped: (args: ThumbnailPageDroppedArgs) => void;
}

export function ThumbnailsPanel({
  pages,
  visible,
  onClick,
  onThumbnailPageDropped
}: Args) {

  let css_class_name = 'thumbnails-panel';

  if (!visible) {
    css_class_name += ' hidden';
  }

  return (
    <div className={css_class_name}>
      {pages.map(page => {
        return <PageThumbnail
          key={page.id}
          page={page}
          onClick={onClick}
          onThumbnailPageDropped={onThumbnailPageDropped} />
      })}
    </div>
  );
}
