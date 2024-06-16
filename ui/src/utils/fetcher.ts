
import Cookies from 'js-cookie';
import type { DefaultHeaderType } from 'types';


const COOKIE_NAME = 'access_token';
const COOKIE_REMOTE_USER = 'remote_user';
const COOKIE_REMOTE_GROUPS = 'remote_groups';
const COOKIE_REMOTE_EMAIL = 'remote_email';
const COOKIE_REMOTE_NAME = 'remote_name';

function get_default_headers(cookie_name: string = COOKIE_NAME): DefaultHeaderType {
  const token = Cookies.get(cookie_name);
  const remote_user = Cookies.get(COOKIE_REMOTE_USER);
  const remote_groups = Cookies.get(COOKIE_REMOTE_GROUPS);
  const remote_email = Cookies.get(COOKIE_REMOTE_EMAIL);
  const remote_name = Cookies.get(COOKIE_REMOTE_NAME);

  let headers;

  if (remote_user) {
    headers = {
      'Remote-User': remote_user,
      'Remote-Groups': remote_groups || '',
      'Remote-Email': remote_email || '',
      'Remote-Name': remote_name || '',
      'Content-Type': 'application/json'
    }
  } else {
    headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  return headers;
}


async function download_file(url: string, file_name: string) {
  /*
  Downloads file from given URL.

  Based on:
    https://stackoverflow.com/questions/32545632/how-can-i-download-a-file-using-window-fetch
  */
  return fetch(url, {
    headers: get_default_headers()
  })
  .then( res => {
    if (res.status === 401) {
      throw Error(`${res.status} ${res.statusText}`);
    }
    return res.blob();
  })
  .then( blob => {
    let url = window.URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = file_name;
    // we need to append the element to the dom -> otherwise it will not work in firefox
    document.body.appendChild(a);
    a.click();
    //afterwards we remove the element again
    a.remove();
  });
}


async function fetcher(url:string) {
  const headers = get_default_headers();
  return fetch(url, {headers: headers})
    .then(res => {
      if (res.status === 401) {
        throw Error("401 Unauthorized");
      }
      return res.json();
    });
}

async function fetcher_post<Input, Output>(
  url: string,
  data: Input,
  signal?: AbortSignal
): Promise<Output> {
  const headers = get_default_headers();

  return fetch(
    url,
    {
      method: "post",
      headers: headers,
      body: JSON.stringify(data),
      signal: signal
    }
  )
  .then(res => {
    if (res.status === 401) {
      throw Error(`${res.status} ${res.statusText}`)
    }
    return res.json()
  });
}

async function fetcher_upload(url: string, file: File) {
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
    url,
    {
      method: "post",
      headers: headers,
      body: form_data
    }
  ).then(res => {
    if (res.status == 401) {
      throw Error(`${res.status} ${res.statusText}`);
    }
    return res;
  });
}

async function fetcher_patch<Input, Output>(url: string, data: Input, signal?: AbortSignal): Promise<Output> {
  let headers = get_default_headers();

  return fetch(
    url,
    {
      method: "PATCH",
      headers: headers,
      body: JSON.stringify(data),
      signal: signal
    }
  ).then(res => {
    if (res.status === 401) {
      throw Error(`${res.status} ${res.statusText}`)
    }
    return res.json()
  });
}

async function fetcher_delete<Input, Output>(
  url: string,
  data: Input,
  signal?: AbortSignal,
  serialize_response?: boolean
): Promise<Output|Response> {
  const headers = get_default_headers();

  let result = fetch(
    url,
    {
      method: "delete",
      headers: headers,
      body: JSON.stringify(data),
      signal: signal
    }
  );

  // serialize response by default
  if (serialize_response === undefined) {
    serialize_response = true;
  }

  if (serialize_response === true) {
    return result.then(res => {
      if (res.status === 401) {
        throw Error(`${res.status} ${res.statusText}`)
      }
      return res.json()
    });
  }

  return result;
}


export {
  get_default_headers,
  download_file,
  fetcher,
  fetcher_upload,
  fetcher_post,
  fetcher_patch,
  fetcher_delete
};
