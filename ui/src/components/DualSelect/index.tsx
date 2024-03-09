import Form from 'react-bootstrap/Form';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';
import { useResource } from 'hooks/resource';
import { ScopeType } from 'types';
import { Button } from 'react-bootstrap';
import "./dual-select.scss";


function DualSelect() {
  const scopes = useResource<ScopeType>("/api/scopes/")

  if (scopes.is_pending) {
    return <div>Loading...</div> // or some sort of placeholder here
  }

  return(
    <Container>
      <Row>
        <Col>
          <Form.Select className='dual-select' multiple aria-label="Default select example">
            <option value="1">One</option>
            <option value="2">Two</option>
            <option value="3">Three</option>
            <option value="4">Four</option>
            <option value="5">Five</option>
            <option value="6">Six</option>
            <option value="7">Seven</option>
            <option value="8">Eight</option>
          </Form.Select>
        </Col>
        <Col xs={1}>
           <MoveButtons />
        </Col>
        <Col>
          <Form.Select className='dual-select' multiple aria-label="Default select example">
            <option value="4">Four</option>
          </Form.Select>
        </Col>
      </Row>
    </Container>
  );
}


function MoveButtons() {
  return <Stack gap={2}>
    <Button size='sm' variant='light'>
      <span className='bi bi-chevron-left'></span>
    </Button>
    <Button size='sm' variant='light'>
      <span className='bi bi-chevron-right'></span>
    </Button>
    <Button size='sm' variant='light'>
      <span className='bi bi-chevron-double-left'></span>
    </Button>
    <Button size='sm' variant='light'>
      <span className='bi bi-chevron-double-right'></span>
    </Button>
  </Stack>
}

export default DualSelect;
