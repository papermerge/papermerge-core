import { useState } from 'react';
import Form from 'react-bootstrap/Form';
import { ExtractStrategy } from 'types';

type Args = {
  strategy: ExtractStrategy;
  title_format: string;
  onStrategyChange: (arg: ExtractStrategy) => void;
  onTitleFormatChange: (arg: string) => void;
}

function ExtractPagesOptions({
  strategy,
  title_format,
  onStrategyChange,
  onTitleFormatChange
}: Args) {

  const [checked, setChecked] = useState<boolean>(false);

  const onLocalCheck = () => {
    let new_checked_value = !checked;

    console.log(`Checked ${new_checked_value}`);
    if (new_checked_value) {
      onStrategyChange('one-page-per-doc');
    } else {
      onStrategyChange('all-pages-in-one-doc');
    }
    setChecked(new_checked_value);
  }

  return <>
    <div>
      <Form.Label htmlFor="title">Title Format:</Form.Label>
      <div className='d-flex align-items-center'>
        <Form.Control
          value={title_format}
          onChange={(e) => onTitleFormatChange(e.target.value)}
          id="title" aria-describedby="title-format-help" />.pdf
      </div>
      <Form.Text id="title-format-help" muted>
        Extracted pages will be placed in document(s) with name "{title_format}-[ID].pdf"
      </Form.Text>
      <Form.Check
        value={strategy}
        checked={checked}
        onChange={onLocalCheck}
        label={`Extract each page into separate document`} />
    </div>
  </>;
}


export default ExtractPagesOptions;
