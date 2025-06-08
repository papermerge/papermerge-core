import react from "@vitejs/plugin-react"
import {defineConfig} from "vite"

export default defineConfig({
  plugins: [react()],
  root: "." // project root is this workspace folder
})
