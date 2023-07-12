
import Cookies from 'js-cookie';


type DefaultHeaderType = {
  'Authorization': string,
  'Content-Type': string;
}

const COOKIE_NAME = 'access_token';

function get_default_headers(cookie_name: string = COOKIE_NAME): DefaultHeaderType {
  const token = Cookies.get(cookie_name);
  let headers;

  headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  return headers;
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
  .then(res => res.json())
  .catch((err) => console.log(`fetch post error=${err}`));
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
  );
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
  ).then(res => res.json());
}

async function fetcher_delete<Input, Output>(
  url: string,
  data: Input,
  serialize_response?: boolean
): Promise<Output|Response> {
  const headers = get_default_headers();

  let result = fetch(
    url,
    {
      method: "delete",
      headers: headers,
      body: JSON.stringify(data)
    }
  );

  // serialize response by default
  if (serialize_response === undefined) {
    serialize_response = true;
  }

  if (serialize_response === true) {
    return result.then(res => res.json());
  }

  return result;
}


export {
  get_default_headers,
  fetcher,
  fetcher_upload,
  fetcher_post,
  fetcher_patch,
  fetcher_delete
};
