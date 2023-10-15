import type { PageAndRotOp, ThumbnailPageDroppedArgs } from "types"
import { PageThumbnail } from "./page_thumbnail";
import type { Vow } from "types";


type Args = {
  pages: Vow<Array<PageAndRotOp>>;
  visible: boolean;
  onSelect: (page_id: string, selected: boolean) => void;
  onClick: (page: PageAndRotOp) => void;
  onThumbnailPageDropped: (args: ThumbnailPageDroppedArgs) => void;
}

export function ThumbnailsPanel({
  pages,
  visible,
  onClick,
  onThumbnailPageDropped,
  onSelect
}: Args) {

  let css_class_name = 'thumbnails-panel';

  if (!visible) {
    css_class_name += ' hidden';
  }

  if (pages.is_pending) {
    return <div>Pending...</div>
  }

  if (pages.error) {
    return <div>Error {pages.error}</div>
  }

  if (!pages.data) {
    return <div>Failed to load data</div>
  }

  return (
    <div className={css_class_name}>
      {pages.data.map(item => {
        return <PageThumbnail
          key={item.page.id}
          item={item}
          onSelect={onSelect}
          onClick={onClick}
          onThumbnailPageDropped={onThumbnailPageDropped} />
      })}
    </div>
  );
}
