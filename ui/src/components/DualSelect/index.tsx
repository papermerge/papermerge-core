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
import { useEffect, useState } from 'react';
import "./dual-select.scss";


function DualSelect() {
  const vow = useResource<ScopeType>("/api/scopes/");
  const [allItems, setAllItems] = useState<Array<SelectItem>>([]);
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
    setAllItems(selectItems);
    setLeftPanelItems(selectItems);
  }, [vow.data]);

  const onChangeLeft = (e: React.ChangeEvent<HTMLSelectElement>) => {
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
    setLeftPanelSelectedItems(selectedItems);
  }

  const onChangeRight = (e: React.ChangeEvent<HTMLSelectElement>) => {
  }

  const onMoveToRight = () => {
    let newLeftItems: Array<SelectItem> = [];

    if (leftPanelSelectedItems.length == 0) {
      return;
    }

    for (let i = 0; i < leftPanelItems.length; i++) {
      let selected = leftPanelSelectedItems.find(
        item => leftPanelItems[i].key == item.key
      );

      if (!selected) {
        // panel will contain only items which are not selected
        newLeftItems.push(leftPanelItems[i]);
      }
    }

    setLeftPanelItems(newLeftItems); // only unselected items
    setRightPanelItems([...rightPanelItems, ...leftPanelSelectedItems]);
    setLeftPanelSelectedItems([]);
    setRightPanelSelectedItems([]);
  }

  const onMoveAllToRight = () => {
    setRightPanelItems(allItems);
    setLeftPanelItems([]);
    setLeftPanelSelectedItems([]);
    setRightPanelSelectedItems([]);
  }

  const onMoveToLeft = () => {
    let newRightItems: Array<SelectItem> = [];

    if (rightPanelSelectedItems.length == 0) {
      return;
    }

    for (let i = 0; i < rightPanelItems.length; i++) {
      let selected = rightPanelSelectedItems.find(
        item => rightPanelItems[i].key == item.key
      );

      if (!selected) {
        // panel will contain only items which are not selected
        newRightItems.push(leftPanelItems[i]);
      }
    }

    setRightPanelItems(newRightItems); // only unselected items
    setLeftPanelItems([...leftPanelItems, ...rightPanelSelectedItems]);
    setLeftPanelSelectedItems([]);
    setRightPanelSelectedItems([]);
  }

  const onMoveAllToLeft = () => {
    setRightPanelItems([]);
    setLeftPanelItems(allItems);
    setLeftPanelSelectedItems([]);
    setRightPanelSelectedItems([]);
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
            onChange={onChangeLeft}/>
        </Col>
        <Col xs={1}>
           <MoveButtons
            onMoveToRight={onMoveToRight}
            onMoveToLeft={onMoveToLeft}
            onMoveAllToRight={onMoveAllToRight}
            onMoveAllToLeft={onMoveAllToLeft} />
        </Col>
        <Col>
          <Select
            items={rightPanelItems}
            onChange={onChangeRight} />
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
