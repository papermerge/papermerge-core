import {createBrowserRouter} from "react-router-dom"

import App from "@/app/App.tsx"
import Home from "@/pages/Home"
import {loader as homeLoader} from "@/pages/Home"
import Inbox from "@/pages/Inbox"
import {loader as inboxLoader} from "@/pages/Inbox"
import Folder from "@/pages/Folder"
import {loader as folderLoader} from "@/pages/Folder"

import Document from "@/pages/Document"

import TagsList from "@/pages/tags/List"
import GroupsList from "@/pages/groups/List.tsx"
import UsersList from "@/pages/users/List.tsx"

import {loader as tagsListLoader} from "@/pages/tags/List"
import {loader as groupsListLoader} from "@/pages/groups/List"
import {loader as usersListLoader} from "@/pages/users/List"

import TagDetails from "@/pages/tags/Details.tsx"
import GroupDetails from "@/pages/groups/Details.tsx"
import UserDetails from "@/pages/users/Details.tsx"

import {loader as tagDetailsLoader} from "@/pages/tags/Details"
import {loader as groupDetailsLoader} from "@/pages/groups/Details"
import {loader as userDetailsLoader} from "@/pages/users/Details"
import {loader as documentLoader} from "@/pages/Document"

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
        loader: homeLoader
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
        element: <Document />,
        loader: documentLoader
      },
      {
        path: "/tags",
        element: <TagsList />,
        loader: tagsListLoader
      },
      {
        path: "/tags/:tagId",
        element: <TagDetails />,
        loader: tagDetailsLoader
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
