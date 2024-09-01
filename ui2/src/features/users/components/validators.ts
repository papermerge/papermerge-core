export function usernameValidator(value: string): string | null {
  if (!value) {
    return "Cannot be empty"
  }

  if (value.trim().length < 2) {
    return "Must be at least 2 characters long"
  }

  if (!/^[a-zA-Z0-9_\-\.]+$/.test(value)) {
    return "Must contain only a-z, A-Z, 0-9, - and . characters"
  }

  if (!/^(?=.*[a-zA-Z]).{1,}$/.test(value)) {
    return "Must contain at least one letter"
  }

  return null
}

export function emailValidator(value: string): string | null {
  if (!value) {
    return "Cannot be empty"
  }

  return null
}
