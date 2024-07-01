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
import Users from "@/pages/Users.tsx"
import {loader as usersLoader} from "@/pages/Users"
import Groups from "@/pages/Groups.tsx"
import {loader as groupsLoader} from "@/pages/Groups"
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
        element: <Groups />,
        loader: groupsLoader
      },
      {
        path: "/users",
        element: <Users />,
        loader: usersLoader
      }
    ]
  }
])

export default router
