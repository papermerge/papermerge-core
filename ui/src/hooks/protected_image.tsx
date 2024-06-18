import {useState, useEffect, useRef} from "react";
import { get_default_headers } from "utils/fetcher";

import type { State } from 'types';
import type { DefaultHeaderType } from 'types';


type MimeType = "image/jpeg" | "image/svg+xml";
type setBaseType = React.Dispatch<React.SetStateAction<string>>;
type setResultType = React.Dispatch<React.SetStateAction<State<JSX.Element | null>>>;


function fetch_jpeg(
    url: string,
    headers: DefaultHeaderType,
    setBase: setBaseType,
    setResult: setResultType
) {
    return fetch(url, {headers: headers}).then(res => {
        if (res.status == 401) {
          throw Error(`${res.status} ${res.statusText}`);
        }

        if (res.status === 200) {
            res.arrayBuffer().then(data => {
                setBase(
                    _imageEncode(data, 'image/jpeg')
                );
                setResult({
                    is_loading: false,
                    error: null,
                    data: <img src={_imageEncode(data, 'image/jpeg')}></img>
                });
            });
        }
    });
}


export const useProtectedSVG = (url: string | null, fallback_url: string | null) => {
    /*
    In case fetching url returns 404, then fallback_url will be tried.
    `url` - is the URL of the SVG image.
    `fallback_url` - is the URL of the jpeg image, Jpeg image will
    always exists as it will be generated on the fly in case it is not there
    yet
    */
    //The initial value is empty
    const initial_state: State<JSX.Element | null> = {
        is_loading: true,
        error: null,
        data: null
    };
    const [svg, setSVG] = useState('')
    const [result, setResult] = useState<State<JSX.Element | null>>(initial_state);
    const [base64, setBase64] = useState('data:image/jpeg;base64,');
    const headers = get_default_headers();
    const ref = useRef<HTMLInputElement>(null);
    const result_svg_component = <div ref={ref}></div>;

    if (!url) {
      return {
        is_loading: false,
        data: null,
        error: 'Page url is null. Maybe page previews not yet ready?'
      };
    }

    useEffect(() => {
        fetch(url, {headers: headers}).then(res => {
            if (res.status === 200) {
                res.text().then(data => {
                    setSVG(data);
                    setResult({
                        is_loading: false,
                        error: null,
                        data: result_svg_component
                    });
                });
            } else if (res.status == 404 || res.status == 403) {
                if (!fallback_url) {
                    setResult({
                        is_loading: false,
                        error: null,
                        data: result_svg_component
                    });
                    return;
                }
                // fallback to jpeg image
                fetch_jpeg(fallback_url, headers, setBase64, setResult);
            }
        });
    }, [url]);

    useEffect(() => {
        if (ref?.current) {
          ref.current.innerHTML = svg;
        }
    }, [svg]);

    return result;
}


export const useProtectedJpg = (url:string) => {
    //The initial value is empty
    const initial_state: State<JSX.Element | null> = {
        is_loading: true,
        error: null,
        data: null
    };
    const [base64, setBase64] = useState('data:image/jpeg;base64,')
    const [result, setResult] = useState<State<JSX.Element | null>>(initial_state)
    const headers = get_default_headers();

    if (!url) {
        return {
            is_loading: false,
            data: null,
            error: 'Page url is null. Maybe page previews not yet ready?'
        };
    }

    useEffect(() => {
        fetch_jpeg(url, headers, setBase64, setResult).catch(
          (error: Error) => {
            setResult({
              is_loading: false,
              data: null,
              error: error.toString()
            })
          }
        );
    }, [url]);

    return result;
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
