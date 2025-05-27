import {FetchBaseQueryError} from "@reduxjs/toolkit/query"

/**
 * Type predicate to narrow an unknown error to `FetchBaseQueryError`
 */
export function isFetchBaseQueryError(
  error: unknown
): error is FetchBaseQueryError {
  return typeof error === "object" && error != null && "status" in error
}

export function isHTTP403Forbidden(error: unknown): boolean {
  if (isFetchBaseQueryError(error)) {
    if ("status" in error && error.status === 403) {
      return true
    }
  }

  return false
}

export function isHTTP404NotFound(error: unknown): boolean {
  if (isFetchBaseQueryError(error)) {
    if ("status" in error && error.status === 404) {
      return true
    }
  }

  return false
}

export function isHTTP422UnprocessableContent(error: unknown): boolean {
  if (isFetchBaseQueryError(error)) {
    if ("status" in error && error.status === 422) {
      return true
    }
  }

  return false
}

/**
 * Type predicate to narrow an unknown error to an object with a string 'message' property
 */
export function isErrorWithMessage(error: unknown): error is {message: string} {
  return (
    typeof error === "object" &&
    error != null &&
    "message" in error &&
    typeof (error as any).message === "string"
  )
}
