import type { PageType } from "types"
import { PageThumbnail } from "./page_thumbnail";
import { PAGE_ID } from "./constants";


type Args = {
  pages: Array<PageType>;
  visible: boolean;
  onClick: (page: PageType) => void;
}

export function ThumbnailsPanel({pages, visible, onClick}: Args) {

  let css_class_name = 'thumbnails-panel';

  if (!visible) {
    css_class_name += ' hidden';
  }

  const onDrag = (page: PageType) => {
  }

  const onLocalDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const page_id: string = event.dataTransfer.getData(PAGE_ID);

    console.log(`PAGE DROP; dropped page_id=${page_id}`);
  }

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }

  const onDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }

  return (
    <div onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDrop={onLocalDrop}
      className={css_class_name}>
      {pages.map(page => <PageThumbnail onDrag={onDrag} key={page.id} page={page} onClick={onClick} />)}
    </div>
  );
}
