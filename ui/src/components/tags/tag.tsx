import "./tag.scss";
import { IColoredTag } from "types";

type Args = {
  item: IColoredTag;
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
