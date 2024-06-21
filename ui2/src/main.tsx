import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import App from './App.tsx'
import Tags from './pages/Tags.tsx';
import Inbox from './pages/Inbox.tsx';
import Home from './pages/Home.tsx';
import Users from './pages/Users.tsx';
import Groups from './pages/Groups.tsx';
import ErrorPage from "./pages/Error.tsx";
import './index.css'
import { store } from './store.ts'


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
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>,
)
