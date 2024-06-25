import {useSelector} from "react-redux"
import {selectPanels} from "@/slices/dualPanel"
import SinglePanel from "@/components/SinglePanel"

export default function DualPanel() {
  const [mainPanel, secondaryPanel] = useSelector(selectPanels)

  if (secondaryPanel) {
    return (
      <>
        <SinglePanel mode="main" />
        <SinglePanel mode="secondary" />
      </>
    )
  }

  return <SinglePanel mode="main" />
}
