import Form from 'react-bootstrap/Form';
import { OCRCode } from 'types';
import { OCR_LANG } from 'cconstants';
import { ChangeEvent } from 'react';
import { useResource } from 'hooks/resource';



type Args = {
  onChange: (arg: OCRCode) => void;
  defaultValue: OCRCode;
}

function OCRLang({onChange, defaultValue}: Args) {

  const langs = useResource<Array<OCRCode>>("/api/ocr-languages/")

  const onLocalChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as OCRCode;
    onChange(value);
  }

  if (langs.is_pending) {
    return <div>Loading...</div>
  }

  if (langs.error) {
    return <div>{langs.error}</div>
  }

  const filtered_langs = langs.data!.filter((l) => l != 'osd');

  const lang_options = filtered_langs.map(
    code => <option key={code} value={code}>{get_human_lang(code)}</option>
  )

  return <div>
    <Form.Label htmlFor="strategy">OCR Language:</Form.Label>
    <Form.Select defaultValue={defaultValue} onChange={onLocalChange}>
      {lang_options}
    </Form.Select>
  </div>;
}


function get_human_lang(value: OCRCode): string {
  /** returns human text for language code.
   *
   * Examples:
   *
   *  deu -> Deutsch
   *  fra -> Français
   *
   * If language code mapping is not found in OCR_LANG - will
   * return the OCR code as string.
  */
  const result = OCR_LANG[value];

  if (!result) {
    return `${value}`;
  }

  return result;
}


export default OCRLang;
