import { useState, useEffect } from 'react';


type ComputedHeightArgs = {
  element_id?: string | null;
  element_class?: string | null;
  default_value: number;
}


function get_computed_height(
  {element_id, element_class, default_value}: ComputedHeightArgs
): number {
  let el, styles, height;

  if (element_id) {
    el = document.getElementById(element_id);
  } else if (element_class) {
    el  = document.getElementsByClassName(element_class)[0];
  }

  if (!el) {
    if (element_id) {
      console.info(`Element with ID ${element_id} not found`);
    }
    if (element_class) {
     console.info(`Element with class name ${element_class} not found`);
    }
    return default_value; // blunt guess of element height
  }

  styles = window.getComputedStyle(el);

  height = parseInt(styles.height);
  height += parseInt(styles.marginTop);
  height += parseInt(styles.marginBottom);

  return height;
}

function get_navbar_height(): number {
  let result =  get_computed_height({
    element_class: 'nav-top',
    default_value: 56
  });

  console.log(`get_navbar_height = ${result}`);

  return result;
}

function get_breadcrumb_height(): number {
  let result = get_computed_height({
    element_class: 'breadcrumb',
    default_value: 40
  });

  console.log(`get_breadcrumb_height = ${result}`);

  return result;
}

function get_action_panel_height(): number {
  let result = get_computed_height({
    element_class: 'action-panel',
    default_value: 100
  });

  console.log(`get_action_panel_height = ${result}`);

  return result;
}

function get_height() {
  let height: number = window.innerHeight;

  height -= get_navbar_height();
  height -= get_breadcrumb_height();
  height -= get_action_panel_height();

  return height;
}

export const useContentHeight = () => {
  /**
   * Calculate the height of the viewer/commander content visible area as
   *
   * window_height - breadcrumb_height - nav_top_height
   */
  //The initial value is empty
  const [height, setHeight] = useState(get_height())

  useEffect(() => {
    const resizeListener = () => {
      // change width from the state object
      setHeight(get_height())
    };
    // set resize listener
    window.addEventListener('resize', resizeListener);

    // clean up function
    return () => {
      // remove resize listener
      window.removeEventListener('resize', resizeListener);
    }
  }, [])

  return height;
}
