import useSWR from 'swr';
import Cookies from 'js-cookie';


export const fetcher = (url:string) => {
  const token = Cookies.get('token');
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  let full_url = `http://localhost:8000${url}`;

  return fetch(full_url, {headers: headers}).then(res => res.json());
}

export function getCurrentUser() {
  const { data, error, isLoading } = useSWR('/users/me', fetcher);

  return {
    user: data,
    isLoading,
    isError: error
  }
}

export function getNode(node_id: string) {
  const { data, error, isLoading } = useSWR(`/nodes/${node_id}`, fetcher);

  return {
    node: data,
    isLoading,
    isError: error
  }
}


export function is_empty<T>(value: T[]): boolean {
  if (!value) {
    return true;
  }

  if (value.length == 0) {
    return true;
  }

  return false;
}