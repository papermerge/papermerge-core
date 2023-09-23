import type { PageAndRotOp, ThumbnailPageDroppedArgs } from "types"
import { PageThumbnail } from "./page_thumbnail";


type Args = {
  pages: Array<PageAndRotOp>;
  visible: boolean;
  onClick: (page: PageAndRotOp) => void;
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
      {pages.map(item => {
        return <PageThumbnail
          key={item.page.id}
          item={item}
          onClick={onClick}
          onThumbnailPageDropped={onThumbnailPageDropped} />
      })}
    </div>
  );
}
