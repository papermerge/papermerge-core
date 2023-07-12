import { useState, useEffect } from "react";
import { Table, Button } from "react-bootstrap";

import { fetcher, fetcher_patch } from "utils/fetcher";
import type {ColoredTagList, LoadableTagList, ColoredTag} from "types";

import TagRow from "components/tags/row";


export default function Tags() {

  const initial_tag_list = {
    is_loading: true,
    error: null,
    data: null
  }
  const [show_add_item, setShowAddItem] = useState(false);
  // ID of the tag which is currently in edit mode
  const [current_edit_id, setCurrentEditId] = useState<string|null>(null);
  const [tag_list, setTagList] = useState<LoadableTagList>(initial_tag_list);

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

  const onUpdate = async (item: ColoredTag, signal: AbortSignal) => {
    let response_tag: ColoredTag = await fetcher_patch<ColoredTag, ColoredTag>(
      `/api/tags/${item.id}`,
      item,
      signal
    );
  }

  useEffect(() => {
    fetcher(`/api/tags/`).then((data: ColoredTagList) => {
      setTagList({is_loading: false, error: null, data: data});
    }).catch((error: Error) => {
      setTagList({is_loading: false, error: error.toString(), data: null});
    });
  }, []);

  if (tag_list.is_loading) {
    return <div>Loading...</div>;
  }

  if (tag_list.error) {
    return <div className="text-danger">{tag_list.error}</div>;
  }

  const tags = tag_list?.data?.items.map(
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
