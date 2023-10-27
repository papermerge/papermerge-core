import Form from 'react-bootstrap/Form';

function ExtractPagesOptions() {
  return <>
    <div>
      <Form.Label htmlFor="title">Title Format:</Form.Label>
      <div className='d-flex align-items-center'>
        <Form.Control id="title" aria-describedby="title-format-help"/>.pdf
      </div>
      <Form.Text id="title-format-help" muted>
        Extracted pages will be placed in document(s) with name [title-format]-[ID].pdf
      </Form.Text>
      <Form.Check label={`Extract each page into separate document`} />
    </div>
  </>;
}


export default ExtractPagesOptions;
