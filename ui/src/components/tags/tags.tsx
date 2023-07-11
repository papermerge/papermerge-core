import { useState, useEffect } from "react";
import { Table, Button } from "react-bootstrap";


import { fetcher } from "utils/fetcher";
import type {ColoredTagList, LoadableTagList} from "types";

import TagRow from "components/tags/row";


export default function Tags() {

  const initial_tag_list = {
    is_loading: true,
    error: null,
    data: null
  }
  const [tag_list, setTagList] = useState<LoadableTagList>(initial_tag_list);

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

  return (
    <div>
      <Button variant="success" className="flat my-1"><i className="bi bi-plus-lg mx-1"></i>New</Button>
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
          {tag_list?.data?.items.map(i => <TagRow item={i} />)}
        </tbody>
      </Table>
    </div>
  );
}
