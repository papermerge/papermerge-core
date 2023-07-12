import { useState, useEffect } from "react";
import { Table, Button } from "react-bootstrap";

import { fetcher } from "utils/fetcher";
import type {ColoredTagList, LoadableTagList, ColoredTag} from "types";

import TagRow from "components/tags/row";


export default function Tags() {
  const [show_add_item, setShowAddItem] = useState(false);
  // ID of the tag which is currently in edit mode
  const [current_edit_id, setCurrentEditId] = useState<string|null>(null);
  const [is_taglist_loading, setIsTaglistLoading] = useState<boolean>(true);
  const [taglist_load_error, setTaglistLoadingError] = useState<string | null>(null);
  const [tag_list, setTagList] = useState<Array<ColoredTag>>([]);

  const onAdd = () => {
    console.log(`new item ${show_add_item}`);
    setShowAddItem(!show_add_item);
  }

  const onSwitchEditMode = (item: ColoredTag) => {
    setCurrentEditId(item.id);
  }

  const onRemove = (item: ColoredTag) => {
    console.log(`removing item ${item.name}`);
  }

  const onCancel = () => {
    setCurrentEditId(null);
  }

  const onUpdate = async (updated_item: ColoredTag) => {
    let new_tag_list = tag_list.map((i: ColoredTag) => {
      if (updated_item.id == i.id) {
        return updated_item;
      } else {
        return i;
      }
    });

    setTagList(new_tag_list);
    setCurrentEditId(null);
  }

  useEffect(() => {
    fetcher(`/api/tags/`).then((data: ColoredTagList) => {
      setTagList(data.items);
      setIsTaglistLoading(false);
    }).catch((error: Error) => {
      setTaglistLoadingError(error.toString());
    });
  }, []);

  if (is_taglist_loading) {
    return <div>Loading...</div>;
  }

  if (taglist_load_error) {
    return <div className="text-danger">{taglist_load_error}</div>;
  }

  const tags = tag_list.map(
    i => <TagRow
            key={i.id}
            item={i}
            onSwitchEditMode={onSwitchEditMode}
            edit_mode={current_edit_id == i.id}
            onRemove={onRemove}
            onCancel={onCancel}
            onUpdate={onUpdate} />
  );

  return (
    <div>
      <Button onClick={onAdd} variant="success" className="flat my-1">
        <i className="bi bi-plus-lg mx-1" />
        New
      </Button>
      <Table striped bordered hover className="align-middle">
      <thead>
        <tr className="text-uppercase text-center">
          <th>Tag Name</th>
          <th>Pinned?</th>
          <th>Description</th>
          <th>Action</th>
        </tr>
      </thead>
        <tbody>
          {tags}
        </tbody>
      </Table>
    </div>
  );
}
