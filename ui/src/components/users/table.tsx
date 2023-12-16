import { useState, useEffect } from "react";
import { Table, Button } from "react-bootstrap";
import Paginator from "components/paginator";
import { fetcher } from "utils/fetcher";

import UserRow from "./row";
import NewUser from "./new_user";
import "./users.scss";

import type { User, UserList, UserView } from './types';


export default function UsersTable() {
  const [view, setView] = useState<UserView>("list");
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
        setUserlistLoadingError(error.toString());
    });
  }, [page_number]);

  const onNew = () => {
    setView("new");
  }

  const addNewUser = () => {
  }

  const showUserTable = () => {
    setView("list");
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
        key={i.id}
        item={i} />)
  );

  if (view == "new") {
    return <NewUser
            onSubmit={addNewUser}
            onCancel={showUserTable} />;
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
          <th>ID</th>
          <th>Username</th>
          <th>Email</th>
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
