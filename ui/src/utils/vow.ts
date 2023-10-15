import type { Vow } from "types"


function init_vow() {
  return {
    is_pending: true,
    error: null,
    data: null
  }
}

function pending_vow<T>(data: T): Vow<T> {
  return {
    is_pending: true,
    error: null,
    data: data
  }
}

function ready_vow<T>(data: T): Vow<T> {
  return {
    is_pending: false,
    error: null,
    data: data
  }
}


export {init_vow, pending_vow, ready_vow};
