import {createBrowserRouter} from "react-router-dom"

import App from "@/app/App.tsx"
import Tags from "@/pages/Tags.tsx"
import Inbox from "@/pages/Inbox.tsx"
import Home from "@/pages/Home.tsx"
import {loader as homeLoader} from "@/pages/Home"
import {loader as inboxLoader} from "@/pages/Inbox"
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
        element: <Home />,
        loader: homeLoader,
        index: true
      },
      {
        path: "/inbox",
        loader: inboxLoader,
        element: <Inbox />
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
