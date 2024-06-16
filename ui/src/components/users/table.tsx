import { useState, useEffect } from "react";
import { Table, Button } from "react-bootstrap";
import Paginator from "components/paginator";
import { fetcher } from "utils/fetcher";

import UserRow from "./row";
import NewUser from "./NewUser";
import EditUser from "./EditUser";
import "./users.scss";

import type { User, UserList, UserView } from './types';


export default function UsersTable() {
  const [view, setView] = useState<UserView>("list");
  // ID of the tag which is currently in edit mode
  const [current_edit_id, setCurrentEditId] = useState<string|null>(null);
  const [user_list, setUserList] = useState<Array<User>>([]);
  const [is_userlist_loading, setIsUserlistLoading] = useState<boolean>(true);
  const [userlist_load_error, setUserlistLoadingError] = useState<string | null>(null);
  const [num_pages, setNumPages] = useState(0);
  const [page_number, setPageNumber] = useState(1);

  useEffect(() => {
    fetcher(`/api/users/?page_number=${page_number}&page_size=10`).then((data: UserList) => {
      setUserList(data.items);
      setNumPages(data.num_pages);
      setIsUserlistLoading(false);
    }).catch((error: Error) => {
        setIsUserlistLoading(false);
        setUserlistLoadingError(error.toString());
    });
  }, [page_number]);

  const onNew = () => {
    setView("new");
  }

  const onSave = (user: User) => {
    setView("list");
    setUserList([...user_list, user]);
  }

  const onEditSave = (user: User) => {
    const new_user_list = user_list.filter(i => i.id != user.id);

    setView("list");
    setUserList([...new_user_list, user]);
  }

  const onCancel = () => {
    setView("list");
  }

  const onEdit = (user_id: string) => {
    setView("edit");
    setCurrentEditId(user_id);
  }

  const onDelete = (user_id: string) => {
    const new_user_list = user_list.filter(user => user.id != user_id);
    setUserList(new_user_list);
  }

  if (is_userlist_loading) {
    return <div>Loading...</div>;
  }

  if (userlist_load_error) {
    return <div className="text-danger">{userlist_load_error}</div>;
  }

  const onPageClick = (page_number: number) => {
    setPageNumber(page_number);
  }

  const users = user_list.map(
    i => (
      <UserRow
        onEdit={onEdit}
        onDelete={onDelete}
        key={i.id}
        item={i} />)
  );

  if (view == "new") {
    return <NewUser
            onSave={onSave}
            onCancel={onCancel} />;
  }

  if (view == "edit" && current_edit_id) {
    const found_user = user_list.find(user => user.id == current_edit_id);

    if (found_user) {
      return <EditUser
              user_id={found_user.id}
              onSave={onEditSave}
              onCancel={onCancel} />
    }
  }

  return (
    <div className="users">
      <Button onClick={onNew} variant="success" className="flat my-1">
        <i className="bi bi-plus-lg mx-1" />
        New
      </Button>
      <Table bordered hover className="align-middle">
      <thead>
        <tr className="text-uppercase text-center">
          <th>Username</th>
          <th>Email</th>
          <th>Superuser</th>
          <th>Active</th>
          <th>Created At</th>
          <th>Action</th>
        </tr>
      </thead>
        <tbody>
          {users}
        </tbody>
      </Table>
      <Paginator
        num_pages={num_pages}
        active={page_number}
        onPageClick={onPageClick} />
    </div>
  );
}
