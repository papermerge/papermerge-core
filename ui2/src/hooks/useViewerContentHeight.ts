import {useState, useEffect} from "react"
import {PanelMode} from "@/types"

export const useViewerContentHeight = (mode: PanelMode) => {
  /**
   * Calculate the height of the viewer/commander content visible area as
   *
   * window_height - breadcrumb_height - nav_top_height
   */
  //The initial value is empty
  const [height, setHeight] = useState(getHeight(mode))

  useEffect(() => {
    const resizeListener = () => {
      // change width from the state object
      setHeight(getHeight(mode))
    }
    // set resize listener
    window.addEventListener("resize", resizeListener)

    // clean up function
    return () => {
      // remove resize listener
      window.removeEventListener("resize", resizeListener)
    }
  }, [])

  return height
}

type ComputedHeightArgs = {
  element_id?: string
  element_class?: string
  default_value: number
}

function getComputedHeight({
  element_id,
  element_class,
  default_value
}: ComputedHeightArgs): number {
  let el, styles, height

  if (element_id) {
    el = document.getElementById(element_id)
  } else if (element_class) {
    el = document.getElementsByClassName(element_class)[0]
  }

  if (!el) {
    if (element_id) {
      console.info(`Element with ID ${element_id} not found`)
    }
    if (element_class) {
      console.info(`Element with class name ${element_class} not found`)
    }
    return default_value // blunt guess of element height
  }

  styles = window.getComputedStyle(el)

  height = parseInt(styles.height)
  height += parseInt(styles.marginTop)
  height += parseInt(styles.marginBottom)

  return height
}

function getNavbarHeight(): number {
  let result = getComputedHeight({
    element_class: "top-header",
    default_value: 56
  })

  console.log(`getNavbarHeight = ${result}`)

  return result
}

function getBreadcrumbHeight(mode: PanelMode): number {
  let result = getComputedHeight({
    element_class: `${mode}-breadcrumb`,
    default_value: 40
  })

  console.log(`getBreadcrumbHeight = ${result}`)

  return result
}

function getActionPanelHeight(mode: PanelMode): number {
  let result = getComputedHeight({
    element_class: `${mode}-action-panel`,
    default_value: 100
  })

  console.log(`get_action_panel_height = ${result}`)

  return result
}

function getHeight(mode: PanelMode) {
  let height: number = window.innerHeight

  height -= getNavbarHeight()
  height -= getBreadcrumbHeight(mode)
  height -= getActionPanelHeight(mode)

  console.log(`NEW HEIGHT=${height}`)
  return height
}
