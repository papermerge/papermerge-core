import {useState, useEffect} from "react"
import {PanelMode} from "@/types"

const SMALL_BOTTOM_MARGIN = 3 /* pixles */

export const useContentHeight = (mode: PanelMode) => {
  /**
   * Calculate the height of the viewer/commander content
   * using following formula. Content is everything in viewer
   * commander but "action panel and breadcrumb":
   *
   *  Content Height = W - B - H - O - S
   *
   * W = window height (same as viewport?)
   * B = breadcrumb height (includes margins and padding)
   * H = header height (includes margin and padding)
   * O = outlet top margin plus top padding
   * S = small adjustment value just to leave couple of pixels
   *     as bottom margin - it is just looks better.
   *     This value is subjective. When set to 0 it, the
   *     Content Height will perfectly alight with window's
   *     bottom.
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

function getOutletTopMarginAndPadding(): number {
  /**
   * main.outlet is the DOM element which holds the react router
   * DOM outlet:
   *  https://reactrouter.com/en/main/components/outlet
   * The outlet element is wrapped around
   *  <AppShell.Main className="outlet" />
   *
   * Important point is viewer's (or commander's)
   * "action panel" and "breadcrumb" are pushed down by outlet's top
   * margin and padding. Outlet itself is being aligned with top
   * viewport.
   */
  let value
  const el = document.getElementsByClassName("outlet")[0]

  if (!el) {
    console.log("Outlet not found")
    return 0
  }

  const styles = window.getComputedStyle(el)

  value = parseInt(styles.marginTop)
  value += parseInt(styles.paddingTop)

  console.log(`Outlet marginTop = ${styles.marginTop}`)
  console.log(`Outlet paddingTop = ${styles.paddingTop}`)

  return value
}

function getBreadcrumbHeight(mode: PanelMode): number {
  let result = getComputedHeight({
    element_class: `${mode}-breadcrumb`,
    default_value: 40
  })

  return result
}

function getActionPanelHeight(mode: PanelMode): number {
  let result = getComputedHeight({
    element_class: `${mode}-action-panel`,
    default_value: 100
  })

  return result
}

function getHeight(mode: PanelMode): number {
  /*
  Returns height of viewer/commander's content.
  The "viewer/commander" content is all what remains
  in viewport after breadcrumb, action panel and area
  ABOVE it is substracted.
  */
  let height: number = window.innerHeight

  height -= getOutletTopMarginAndPadding()
  height -= getBreadcrumbHeight(mode)
  height -= getActionPanelHeight(mode)

  /* Let there be a small margin at the bottom of the viewport */
  height -= SMALL_BOTTOM_MARGIN

  return height
}
