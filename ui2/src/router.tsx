import {createBrowserRouter} from "react-router-dom"

import App from "@/app/App.tsx"
import Tags from "@/pages/Tags.tsx"
import Folder from "@/pages/Folder"
import {loader as folderLoader} from "@/pages/Folder"
import Document from "@/pages/Document"
import Users from "@/pages/Users.tsx"
import Groups from "@/pages/Groups.tsx"
import ErrorPage from "@/pages/Error.tsx"

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/folder/:folderId",
        element: <Folder />,
        loader: folderLoader,
        index: true
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
        element: <Groups />
      },
      {
        path: "/users",
        element: <Users />
      }
    ]
  }
])

export default router
