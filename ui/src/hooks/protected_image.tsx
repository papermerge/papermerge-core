import {useState, useEffect, useRef} from "react";
import { get_default_headers } from "../utils/fetcher";

import type { State } from '@/types';


type MimeType = "image/jpeg" | "image/svg+xml";


export const useProtectedSVG = (url: string | null) => {
    //The initial value is empty
    const initial_state: State<JSX.Element | null> = {
        is_loading: true,
        error: null,
        data: null
    };
    const [svg, setSVG] = useState('')
    const [result, setResult] = useState<State<JSX.Element | null>>(initial_state)
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


export const useProtectedJpg = (url:string | null) => {
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
        fetch(url, {headers: headers}).then(res => {
            if (res.status === 200) {
                res.arrayBuffer().then(data => {
                    setBase64(
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
