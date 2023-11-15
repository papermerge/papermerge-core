import Form from 'react-bootstrap/Form';
import { OCRLangType } from './types';
import { ChangeEvent } from 'react';


type Args = {
  onChange: (arg: OCRLangType) => void;
}

function OCRLang({onChange}: Args) {

  const onLocalChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as OCRLangType;
    onChange(value);
  }

  return <div>
    <Form.Label htmlFor="strategy">OCR Language:</Form.Label>
    <Form.Select defaultValue={"deu"} onChange={onLocalChange}>
      <option value="eng">English</option>
      <option value="deu">Deutsch</option>
    </Form.Select>
  </div>;
}

export default OCRLang;
