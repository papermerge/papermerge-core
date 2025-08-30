import {MantineProvider} from "@mantine/core"
import {StrictMode} from "react"
import {createRoot} from "react-dom/client"
import {BrowserRouter, Route, Routes} from "react-router"
import AppShell from "./app/AppShell"
import "./index.css"
import DataTablePage from "./pages/DataTable"
import EditNodeTitleModal from "./pages/EditNodeTitle"
import RoleForm from "./pages/RoleForm"
import RoleFormModal from "./pages/RoleFormModal"
import SubmitButton from "./pages/SubmitButton"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<SubmitButton />} />
            <Route path="edit-node-modal" element={<EditNodeTitleModal />} />
            <Route path="role-form" element={<RoleForm />} />
            <Route path="role-form-modal" element={<RoleFormModal />} />
            <Route path="data-table" element={<DataTablePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  </StrictMode>
)
