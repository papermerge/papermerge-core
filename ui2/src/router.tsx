import {createBrowserRouter} from "react-router-dom"

import App from "@/app/App.tsx"
import Tags from "@/pages/Tags.tsx"
import Home from "@/pages/Home"
import {loader as homeLoader} from "@/pages/Home"
import Inbox from "@/pages/Inbox"
import {loader as inboxLoader} from "@/pages/Inbox"
import Folder from "@/pages/Folder"
import {loader as folderLoader} from "@/pages/Folder"

import Document from "@/pages/Document"
import UsersList from "@/pages/users/List.tsx"
import {loader as usersListLoader} from "@/pages/users/List"
import UserDetails from "@/pages/users/Details.tsx"
import {loader as userDetailsLoader} from "@/pages/users/Details"
import GroupsList from "@/pages/groups/List.tsx"
import {loader as groupsListLoader} from "@/pages/groups/List"
import GroupDetails from "@/pages/groups/Details.tsx"
import {loader as groupDetailsLoader} from "@/pages/groups/Details"

import ErrorPage from "@/pages/Error.tsx"

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/home/:folderId",
        element: <Home />,
        loader: homeLoader,
        index: true
      },
      {
        path: "/inbox/:folderId",
        element: <Inbox />,
        loader: inboxLoader
      },
      {
        path: "/folder/:folderId",
        element: <Folder />,
        loader: folderLoader
      },
      {
        path: "/document/:documentId",
        element: <Document />
      },
      {
        path: "/tags",
        element: <Tags />
      },
      {
        path: "/groups",
        element: <GroupsList />,
        loader: groupsListLoader
      },
      {
        path: "/groups/:groupId",
        element: <GroupDetails />,
        loader: groupDetailsLoader
      },
      {
        path: "/users",
        element: <UsersList />,
        loader: usersListLoader
      },
      {
        path: "/users/:userId",
        element: <UserDetails />,
        loader: userDetailsLoader
      }
    ]
  }
])

export default router
