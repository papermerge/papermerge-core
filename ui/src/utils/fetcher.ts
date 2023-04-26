
import Cookies from 'js-cookie';

type DefaultHeaderType = {
  'Authorization': string,
  'Content-Type': string;
}

const COOKIE_NAME = 'token';

function get_default_headers(cookie_name: string = COOKIE_NAME): DefaultHeaderType {
  const token = Cookies.get(cookie_name);
  let headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  return headers;
}


async function fetcher(url:string) {
  const headers = get_default_headers();
  let full_url = `http://localhost:8000${url}`;

  return fetch(full_url, {headers: headers}).then(res => res.json());
}

async function fetcher_post<Input, Output>(url: string, data: Input): Promise<Output> {
  const headers = get_default_headers();
  let full_url = `http://localhost:8000${url}`;

  return fetch(
    full_url,
    {
      method: "post",
      headers: headers,
      body: JSON.stringify(data)
    }
  ).then(res => res.json());
}

async function fetcher_upload(url: string, file: File) {
  let full_url = `http://localhost:8000${url}`;
  let headers: any = get_default_headers();
  const form_data  = new FormData();

  form_data.append('file', file);
  // without following line of code server side returns
  // 400 bad request "Missing boundary in multipart/form-data"
  // as I learned here:
  // https://stackoverflow.com/questions/39280438/fetch-missing-boundary-in-multipart-form-data-post
  // the solution to the problem is to explicitly set Content-Type to undefined so that
  // your browser or whatever client you're using can set it and add that boundary value
  // in there for you. Disappointing but true.
  delete headers['Content-Type'];

  return fetch(
    full_url,
    {
      method: "post",
      headers: headers,
      body: form_data
    }
  );
}

async function fetcher_patch<Input, Output>(url: string, data: Input): Promise<Output> {
  let headers = get_default_headers();
  let full_url = `http://localhost:8000${url}`;

  return fetch(
    full_url,
    {
      method: "PATCH",
      headers: headers,
      body: JSON.stringify(data)
    }
  ).then(res => res.json());
}

async function fetcher_delete<Input, Output>(url: string, data: Input): Promise<Output> {
  const headers = get_default_headers();
  let full_url = `http://localhost:8000${url}`;

  return fetch(
    full_url,
    {
      method: "delete",
      headers: headers,
      body: JSON.stringify(data)
    }
  ).then(res => res.json());
}



export {
  fetcher,
  fetcher_upload,
  fetcher_post,
  fetcher_patch,
  fetcher_delete
};
