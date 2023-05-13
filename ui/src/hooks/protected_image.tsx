import {useState, useEffect} from "react";
import { get_default_headers } from "../utils/fetcher";


export const useProtectedSVG = (url: string | null) => {
    //The initial value is empty
    const [svg, setSVG] = useState('')
    const headers = get_default_headers();

    if (!url) {
      return svg;
    }

    useEffect(() => {
        fetch(url, {headers: headers}).then(res => {
            if (res.status === 200) {
                res.text().then(data => {
                    setSVG(data);
                });
            }
        });

    }, [url, headers]);

    return svg;
}


export const useProtectedJpg = (url:string | null) => {
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
                    setBase64(_imageEncode(data, 'image/jpeg'))
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
