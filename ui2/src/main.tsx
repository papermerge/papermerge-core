import {MantineProvider} from "@mantine/core"
import {Notifications} from "@mantine/notifications"
import React from "react"
import ReactDOM from "react-dom/client"
import {Provider} from "react-redux"
import {RouterProvider} from "react-router-dom"

import {store} from "@/app/store"
import {cookieLoaded} from "@/features/auth/slice"
import "@/index.css"
import {fetchCurrentUser} from "@/slices/currentUser"
import "@mantine/notifications/styles.css"

import theme from "@/themes"
import router from "./router"

function start_app() {
  store.dispatch(cookieLoaded())
  store.dispatch(fetchCurrentUser())

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <MantineProvider theme={theme}>
        <Provider store={store}>
          <RouterProvider router={router} />
        </Provider>
        <Notifications />
      </MantineProvider>
    </React.StrictMode>
  )
}

start_app()
