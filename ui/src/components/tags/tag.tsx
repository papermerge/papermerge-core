
import type { ColoredTag } from "types";
import "./tag.scss";

type Args = {
  item: ColoredTag;
}

export default function Tag({item}: Args) {
  const style = {
    'backgroundColor': item.bg_color,
    'color': item.fg_color
  }

  return (
    <span className="tag" style={style}>
      {item.name}
    </span>
  );
}
