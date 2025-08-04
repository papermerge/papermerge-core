import {MantineProvider} from "@mantine/core"
import {StrictMode} from "react"
import {createRoot} from "react-dom/client"
import {BrowserRouter, Route, Routes} from "react-router"
import AppShell from "./app/AppShell"
import "./index.css"
import EditNodeTitleModal from "./pages/EditNodeTitle"
import SubmitButton from "./pages/SubmitButton"
import RoleForm from "./pages/RoleForm"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<SubmitButton />} />
            <Route path="edit-node-modal" element={<EditNodeTitleModal />} />
            <Route path="role-form" element={<RoleForm />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  </StrictMode>
)
