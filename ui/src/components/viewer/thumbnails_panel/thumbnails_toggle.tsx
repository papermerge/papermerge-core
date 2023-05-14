
type Args = {
  onclick: () => void;
  thumbnails_panel_visible: boolean;
}

export function ThumbnailsToggle({onclick, thumbnails_panel_visible}: Args) {

  let icon_class: string = 'bi bi-arrow-left-square';

  if (thumbnails_panel_visible) {
    icon_class = 'bi bi-arrow-left-square';
  } else {
    icon_class = 'bi bi-arrow-right-square';
  }

  return (
    <div className="thumbnails-toggle">
      <i
        className={icon_class}
        onClick={onclick} />
    </div>
  );
}
