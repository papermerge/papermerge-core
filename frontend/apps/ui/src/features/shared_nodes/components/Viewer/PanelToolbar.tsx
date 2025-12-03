import PanelToolbar from "@/components/DualPanel/PanelToolbar"
import DownloadButton from "./DownloadButton"

export default function PanelToolbarContainer() {
  return <PanelToolbar leftActions={<DownloadButton />} />
}
