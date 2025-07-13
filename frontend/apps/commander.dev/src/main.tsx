import {MantineProvider} from "@mantine/core"
import {StrictMode} from "react"
import {createRoot} from "react-dom/client"
import {BrowserRouter, Route, Routes} from "react-router"
import AppShell from "./app/AppShell"
import "./index.css"
import Index from "./pages/Index"
import SupportedFilesInfoModal from "./pages/SupportedFilesInfoModal"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<Index />} />
            <Route
              path="supported-files-info-modal"
              element={<SupportedFilesInfoModal />}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  </StrictMode>
)
