import { useState, useEffect } from "react";
import { Table, Button } from "react-bootstrap";
import Paginator from "components/paginator";
import { fetcher } from "utils/fetcher";

import GroupRow from "./row";
import NewGroup from "./NewGroup";
import EditGroup from "./EditGroup";

import type { Group, GroupList, GroupView } from './types';


export default function GroupsTable() {
  const [view, setView] = useState<GroupView>("list");
  // ID of the tag which is currently in edit mode
  const [current_edit_id, setCurrentEditId] = useState<number|null>(null);
  const [group_list, setUserList] = useState<Array<Group>>([]);
  const [is_grouplist_loading, setIsGrouplistLoading] = useState<boolean>(false);
  const [grouplist_load_error, setGrouplistLoadingError] = useState<string | null>(null);
  const [num_pages, setNumPages] = useState(0);
  const [page_number, setPageNumber] = useState(1);


  useEffect(() => {
    fetcher(`/api/groups/?page_number=${page_number}&page_size=10`).then((data: GroupList) => {
      setUserList(data.items);
      setNumPages(data.num_pages);
      setIsGrouplistLoading(false);
    }).catch((error: Error) => {
        setGrouplistLoadingError(error.toString());
    });
  }, [page_number]);


  const onNew = () => {
    setView("new");
  }

  const onSave = (group: Group) => {
    setView("list");
    setUserList([...group_list, group]);
  }

  const onEditSave = (group: Group) => {
    const new_group_list = group_list.filter(i => i.id != group.id);

    setView("list");
    setUserList([...new_group_list, group]);
  }

  const onCancel = () => {
    setView("list");
  }

  const onEdit = (group_id: number) => {
    setView("edit");
    setCurrentEditId(group_id);
  }

  const onDelete = (group_id: number) => {
    const new_user_list = group_list.filter(group => group.id != group_id);
    setUserList(new_user_list);
  }

  if (is_grouplist_loading) {
    return <div>Loading...</div>;
  }

  if (grouplist_load_error) {
    return <div className="text-danger">{grouplist_load_error}</div>;
  }

  const onPageClick = (page_number: number) => {
    setPageNumber(page_number);
  }

  const groups = group_list.map(
    i => (
      <GroupRow
        onEdit={onEdit}
        onDelete={onDelete}
        key={i.id}
        item={i} />)
  );

  if (view == "new") {
    return <NewGroup
            onSave={onSave}
            onCancel={onCancel} />;
  }

  if (view == "edit" && current_edit_id) {
    const found_group = group_list.find(group => group.id == current_edit_id);

    if (found_group) {
      return <EditGroup
              group_id={found_group.id}
              onSave={onEditSave}
              onCancel={onCancel} />
    }
  }

  return (
    <div className="groups">
      <Button onClick={onNew} variant="success" className="flat my-1">
        <i className="bi bi-plus-lg mx-1" />
        New
      </Button>
      <Table bordered hover className="align-middle">
      <thead>
        <tr className="text-uppercase text-center">
          <th>Name</th>
          <th>Action</th>
        </tr>
      </thead>
        <tbody>
          {groups}
        </tbody>
      </Table>
      <Paginator
        num_pages={num_pages}
        active={page_number}
        onPageClick={onPageClick} />
    </div>
  );
}
