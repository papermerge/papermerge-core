import type { ColoredTagType } from "types";


type Args = {
  tags:  Array<ColoredTagType>,
  max_items: number;
}


function item_style(tag: ColoredTagType) {
  return {
    'backgroundColor': tag.bg_color,
    'color': tag.fg_color,
  }
}


function TagsComponent({tags, max_items}: Args) {

  if (!tags) {
    return <ul className="tags"></ul>;
  }

  let tags_list = tags.map(
    (item: ColoredTagType) => <li key={item.name} style={item_style(item)}>
        {item.name}
      </li>
  );

  if (tags_list.length > max_items) {
    tags_list.splice(max_items);
    tags_list.push(
      <span>...</span>
    );
  }

  return <ul className="tags">
    {tags_list}
  </ul>
}


export default TagsComponent;
