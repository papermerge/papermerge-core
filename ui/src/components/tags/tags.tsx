import { useState, useEffect } from "react";
import { Table, Button } from "react-bootstrap";


import { fetcher } from "utils/fetcher";
import type {ColoredTagList, LoadableTagList, ColoredTag} from "types";

import TagRow from "components/tags/row";


export default function Tags() {

  const initial_tag_list = {
    is_loading: true,
    error: null,
    data: null
  }
  const [show_add_item, setShowAddItem] = useState(false);
  const [tag_list, setTagList] = useState<LoadableTagList>(initial_tag_list);

  const onAdd = () => {
    console.log(`new item ${show_add_item}`);
    setShowAddItem(!show_add_item);
  }

  const onEdit = (item: ColoredTag) => {
    console.log(`editing item ${item.name}`);
  }

  const onRemove = (item: ColoredTag) => {
    console.log(`removing item ${item.name}`);
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
    i => <TagRow key={i.id} item={i} onEdit={onEdit} onRemove={onRemove} />
  );

  return (
    <div>
      <Button onClick={onAdd} variant="success" className="flat my-1">
        <i className="bi bi-plus-lg mx-1" />
        New
      </Button>
      <Table striped bordered hover>
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
