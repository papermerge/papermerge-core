import React from "react"
import ReactDOM from "react-dom/client"
import {Provider} from "react-redux"
import {RouterProvider} from "react-router-dom"
import {MantineProvider} from "@mantine/core"

import "@/index.css"
import {store} from "@/app/store"
import {fetchCurrentUser} from "@/slices/currentUser"
import {cookieLoaded} from "@/features/auth/slice"

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
      </MantineProvider>
    </React.StrictMode>
  )
}

start_app()
