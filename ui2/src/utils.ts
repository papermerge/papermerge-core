export function getRestAPIURL(): string {
  const rest_api_url = import.meta.env.VITE_REST_API_URL;
  if (rest_api_url) {
    return rest_api_url;
  }

  return "";
}

export function getRemoteUser(): string | null {
  const remote_user = import.meta.env.VITE_REMOTE_USER;

  if (remote_user) {
    return remote_user;
  }

  return null;
}

export function getDefaultHeaders(): Record<string, string> {
  const remote_user = getRemoteUser();
  let headers = {};

  if (remote_user) {
    headers = {
      "Remote-User": remote_user,
      "Remote-Groups": "",
      "Remote-Email": "",
      "Remote-Name": "",
      "Content-Type": "application/json",
    };
  }

  return headers;
}
