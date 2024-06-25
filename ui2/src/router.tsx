import {createBrowserRouter} from "react-router-dom"

import App from "@/app/App.tsx"
import Tags from "@/pages/Tags.tsx"
import Home from "@/pages/Home"
import {loader as homeLoader} from "@/pages/Home"
import Inbox from "@/pages/Inbox"
import {loader as inboxLoader} from "@/pages/Inbox"
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
