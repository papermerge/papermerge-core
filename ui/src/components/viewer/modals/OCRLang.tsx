import Form from 'react-bootstrap/Form';
import { OCRLangType } from './types';
import { ChangeEvent } from 'react';
import { useResource } from 'hooks/resource';
import { OCR_LANGS } from 'ocr_langs';


type Args = {
  onChange: (arg: OCRLangType) => void;
}

function OCRLang({onChange}: Args) {

  const langs = useResource<Array<string>>("/api/ocr-languages/")

  const onLocalChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as OCRLangType;
    onChange(value);
  }

  if (langs.is_pending) {
    return <div>Loading...</div>
  }

  const filtered_langs = langs.data!.filter((l) => l != 'osd');

  const lang_options = filtered_langs.map(
    code => <option key={code} value={code}>{OCR_LANGS[code]}</option>
  )

  return <div>
    <Form.Label htmlFor="strategy">OCR Language:</Form.Label>
    <Form.Select defaultValue={"deu"} onChange={onLocalChange}>
      {lang_options}
    </Form.Select>
  </div>;
}

export default OCRLang;
