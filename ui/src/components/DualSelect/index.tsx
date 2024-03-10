import React from 'react';
import Form from 'react-bootstrap/Form';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';
import { useResource } from 'hooks/resource';
import { ScopeType } from 'types';
import { Button } from 'react-bootstrap';
import InputGroup from 'react-bootstrap/InputGroup';
import "./dual-select.scss";
import { useEffect, useState } from 'react';


function DualSelect() {
  const vow = useResource<ScopeType>("/api/scopes/")
  const [leftPanelItems, setLeftPanelItems] = useState<Array<SelectItem>>([]);
  const [leftPanelSelectedItems, setLeftPanelSelectedItems] = useState<Array<SelectItem>>([]);
  const [rightPanelItems, setRightPanelItems] = useState<Array<SelectItem>>([]);
  const [rightPanelSelectedItems, setRightPanelSelectedItems] = useState<Array<SelectItem>>([]);

  useEffect(() => {
    if (vow.data == null) {
      return;
    }
    let selectItems: Array<SelectItem> = [];

    for (const i of Object.entries(vow.data)) {
      selectItems.push({
        key: i[0],
        value: i[1]
      });
    }

    selectItems.sort((a: SelectItem, b: SelectItem) => {
      if (a.key < b.key) {
        return -1;
      } else if (a.key > b.key) {
        return 1;
      }
      return 0;
    });

    setLeftPanelItems(selectItems);
  }, [vow.data]);

  const onChangeRight = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const select = e.target;
    let selectedItems: Array<SelectItem> = [];

    for (const option of select.options) {
      if (option.selected) {
        selectedItems.push({
          key: option.value,
          value: option.label
        })
      }
    }
    setRightPanelSelectedItems(selectedItems);
  }

  const onMoveToRight = () => {
  }

  const onMoveToLeft = () => {
  }

  const onMoveAllToRight = () => {
  }

  const onMoveAllToLeft = () => {
  }

  if (vow.is_pending) {
    return <div>Loading...</div> // or some sort of placeholder here
  }


  return(
    <Container>
      <Row>
        <Col>
          <Filter />
        </Col>
        <Col xs={1}></Col>
        <Col>
          <Filter />
        </Col>
      </Row>
      <Row>
        <Col>
          <Select
            items={leftPanelItems}
            onChange={onChangeRight}/>
        </Col>
        <Col xs={1}>
           <MoveButtons
            onMoveToRight={onMoveToRight}
            onMoveToLeft={onMoveToLeft}
            onMoveAllToRight={onMoveAllToRight}
            onMoveAllToLeft={onMoveAllToLeft} />
        </Col>
        <Col>
          <Form.Select className='dual-select mt-2' multiple aria-label="Default select example">
            <option value="4">Four</option>
          </Form.Select>
        </Col>
      </Row>
    </Container>
  );
}


function Filter() {
  return <InputGroup>
    <InputGroup.Text>
      <span className='bi bi-search'></span>
    </InputGroup.Text>
    <Form.Control />
  </InputGroup>
}

type MoveButtonsArgs = {
  onMoveToRight: () => void;
  onMoveToLeft: () => void;
  onMoveAllToRight: () => void;
  onMoveAllToLeft: () => void;
}


function MoveButtons({
  onMoveToRight,
  onMoveToLeft,
  onMoveAllToRight,
  onMoveAllToLeft
}: MoveButtonsArgs) {
  return <Stack gap={2}>
    <Button size='sm' variant='light' onClick={onMoveToLeft}>
      <span className='bi bi-chevron-left'></span>
    </Button>
    <Button size='sm' variant='light' onClick={onMoveToRight}>
      <span className='bi bi-chevron-right'></span>
    </Button>
    <Button size='sm' variant='light' onClick={onMoveAllToLeft}>
      <span className='bi bi-chevron-double-left'></span>
    </Button>
    <Button size='sm' variant='light' onClick={onMoveAllToRight}>
      <span className='bi bi-chevron-double-right'></span>
    </Button>
  </Stack>
}

type SelectItem = {
  key: string;
  value: string;
}

type SelectArgs = {
  items: Array<SelectItem>;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
}


function Select({items, onChange}: SelectArgs) {
  const listItems = items.map(
    item => <option key={item.key} value={item.key}>{item.value}</option>
  );

  return <Form.Select
      className='dual-select mt-2' multiple
      onChange={onChange}>
    {listItems}
  </Form.Select>
}

export default DualSelect;
