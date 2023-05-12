import {useState, useEffect} from "react";
import { get_default_headers } from "../utils/fetcher";


type MimeType = "image/jpeg" | "image/svg+xml";


export const useProtectedSrc = (url:string | null, mimetype: MimeType) => {
    //The initial value is empty
    const [base64, setBase64] = useState('data:image/jpeg;base64,')
    const headers = get_default_headers();

    if (!url) {
      return base64;
    }

    useEffect(() => {
        fetch(url, {headers: headers}).then(res => {
            if (res.status === 200) {
                res.arrayBuffer().then(data => {
                    setBase64(_imageEncode(data, mimetype))
                });
            }
        });

    }, [url, headers]);

    return base64
}


function _imageEncode(arrayBuffer: ArrayBuffer, mimetype: MimeType) {
  let bytes = new Uint8Array(arrayBuffer);
  let binary: string = '';

  for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode( bytes[ i ] );
  }

  let b64encoded = window.btoa(binary);

  return "data:" + mimetype + ";base64," + b64encoded
}
