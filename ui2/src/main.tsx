import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import Tags from './Tags.tsx';
import Inbox from './Inbox.tsx';
import Home from './Home.tsx';
import Users from './Users.tsx';
import Groups from './Groups.tsx';
import ErrorPage from "./error-page";
import './index.css'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";


const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        element: <Home />,
        index: true
      },
      {
        path: "/inbox",
        element: <Inbox />,
      },
      {
        path: "/tags",
        element: <Tags />,
      },
      {
        path: "/groups",
        element: <Groups />,
      },
      {
        path: "/users",
        element: <Users />,
      }
    ]
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
