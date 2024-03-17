import { useState, useEffect } from "react";
import { Table, Button } from "react-bootstrap";

import { fetcher } from "utils/fetcher";
import type {ColoredTagList, ColoredTag} from "types";
import { IColoredTag } from "types";

import TagRow from "components/tags/row";
import AddTagRow from "components/tags/add";
import Paginator from "components/paginator";


export default function TagsTable() {
  const [show_add_item, setShowAddItem] = useState(false);
  // ID of the tag which is currently in edit mode
  const [current_edit_id, setCurrentEditId] = useState<string|null>(null);
  const [is_taglist_loading, setIsTaglistLoading] = useState<boolean>(true);
  const [taglist_load_error, setTaglistLoadingError] = useState<string | null>(null);
  const [tag_list, setTagList] = useState<Array<ColoredTag>>([]);
  const [num_pages, setNumPages] = useState(0);
  const [page_number, setPageNumber] = useState(1)

  const onAdd = () => {
    setShowAddItem(!show_add_item);
  }

  const onSwitchEditMode = (item: ColoredTag) => {
    setCurrentEditId(item.id);
  }

  const onRemove = (item_to_remove: ColoredTag) => {
    let new_tag_list = tag_list.filter((i: ColoredTag) => item_to_remove.id != i.id);

    setTagList(new_tag_list);
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

  const onAddRowCancel = () => {
    setShowAddItem(false);
  }

  const onAddRowSave = (item: ColoredTag) => {
    setTagList([...tag_list, item]);
    setShowAddItem(false);
    setCurrentEditId(null);
  }

  const onPageClick = (page_number: number) => {
    setPageNumber(page_number);
  }

  useEffect(() => {
    fetcher(`/api/tags/?page_number=${page_number}&page_size=10`).then((data: ColoredTagList) => {
      setTagList(data.items);
      setNumPages(data.num_pages);
      setIsTaglistLoading(false);
    }).catch((error: Error) => {
      setIsTaglistLoading(false);
      setTaglistLoadingError(error.toString());
    });
  }, [page_number]);

  if (is_taglist_loading) {
    return <div>Loading...</div>;
  }

  if (taglist_load_error) {
    return <div className="text-danger">{taglist_load_error}</div>;
  }

  const tags = tag_list.map(
    i => (
      <TagRow
        key={i.id}
        item={i}
        onSwitchEditMode={onSwitchEditMode}
        edit_mode={current_edit_id == i.id}
        onRemove={onRemove}
        onCancel={onCancel}
        onUpdate={onUpdate} />)
  );

  return (
    <div>
      <Button onClick={onAdd} variant="success" className="flat my-1">
        <i className="bi bi-plus-lg mx-1" />
        New
      </Button>
      {show_add_item && <AddTagRow
                          onCancel={onAddRowCancel}
                          onSave={onAddRowSave}/>}
      <Table bordered hover className="align-middle">
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
      <Paginator
        num_pages={num_pages}
        active={page_number}
        onPageClick={onPageClick} />
    </div>
  );
}
