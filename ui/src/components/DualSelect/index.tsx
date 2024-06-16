import React from 'react';
import Form from 'react-bootstrap/Form';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';
import type { SelectItem } from 'types';
import { sortItemsFn } from 'utils/misc';

import { Button } from 'react-bootstrap';
import InputGroup from 'react-bootstrap/InputGroup';
import { useEffect, useState } from 'react';
import "./dual-select.scss";


type Args = {
  allItems: Array<SelectItem>;
  initialSelect: Array<SelectItem>;
  onChange: (scopes: Array<SelectItem>) => void;
}


function DualSelect({onChange, allItems, initialSelect}: Args) {
  const [leftPanelItems, setLeftPanelItems] = useState<Array<SelectItem>>([]);
  const [leftPanelSelectedItems, setLeftPanelSelectedItems] = useState<Array<SelectItem>>([]);
  const [rightPanelItems, setRightPanelItems] = useState<Array<SelectItem>>(initialSelect);
  const [rightPanelSelectedItems, setRightPanelSelectedItems] = useState<Array<SelectItem>>([]);
  const [leftFilter, setLeftFilter] = useState<string|null>();
  const [rightFilter, setRightFilter] = useState<string|null>();

  useEffect(() => {
    setLeftPanelItems(allItems);
  }, [allItems.length]);

  useEffect(() => {
    /** set initial value for left panel */
    let scopes = initialSelect.map(i => i.key);
    let new_left = leftPanelItems.filter(i => !scopes.includes(i.key));
    setRightPanelItems(initialSelect);
    setLeftPanelItems(new_left);
    setLeftPanelSelectedItems([]);
    setRightPanelSelectedItems([]);
  }, [initialSelect.length])

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

    const newRightPanelItems = [...rightPanelItems, ...leftPanelSelectedItems].sort(sortItemsFn);

    setLeftPanelItems(
      newLeftItems.sort(sortItemsFn)
    ); // only unselected items
    setRightPanelItems(newRightPanelItems);
    setLeftPanelSelectedItems([]);
    setRightPanelSelectedItems([]);
    onChange(newRightPanelItems);
  }

  const onMoveAllToRight = () => {
    setRightPanelItems(allItems);
    setLeftPanelItems([]);
    setLeftPanelSelectedItems([]);
    setRightPanelSelectedItems([]);
    onChange(allItems);
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
        newRightItems.push(rightPanelItems[i]);
      }
    }

    const _newRight = newRightItems.sort(sortItemsFn);
    setRightPanelItems(
      _newRight
    ); // only unselected items
    setLeftPanelItems(
      [...leftPanelItems, ...rightPanelSelectedItems].sort(sortItemsFn)
    );
    setLeftPanelSelectedItems([]);
    setRightPanelSelectedItems([]);
    onChange(_newRight);
  }

  const onMoveAllToLeft = () => {
    setRightPanelItems([]);
    setLeftPanelItems(allItems);
    setLeftPanelSelectedItems([]);
    setRightPanelSelectedItems([]);
    onChange([]);
  }

  const onLeftFilterChange = (value: string) => {
    if (!value) {
      setLeftFilter(null);
      return;
    }
    setLeftFilter(value);
  }

  const onRightFilterChange = (value: string) => {
    if (!value) {
      setRightFilter(null);
      return;
    }
    setRightFilter(value);
  }

  return(
    <Container>
      <Row>
        <Col className='text-center'>
          <small className='text-secondary m-0 p-0'>All Items</small>
        </Col>
        <Col xs={1}></Col>
        <Col className='text-center'>
          <small className='text-secondary m-0 p-0'>Selected Items</small>
        </Col>
      </Row>
      <Row>
        <Col>
          <Filter onChange={onLeftFilterChange} />
        </Col>
        <Col xs={1}></Col>
        <Col>
          <Filter onChange={onRightFilterChange} />
        </Col>
      </Row>
      <Row>
        <Col>
          <Select
            items={leftPanelItems}
            filter={leftFilter}
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
            filter={rightFilter}
            onChange={onChangeRight} />
        </Col>
      </Row>
    </Container>
  );
}


type FilterArgs = {
  onChange: (value: string) => void;
}

function Filter({onChange}: FilterArgs) {

  const onLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  }

  return <InputGroup>
    <InputGroup.Text>
      <span className='bi bi-search'></span>
    </InputGroup.Text>
    <Form.Control onChange={onLocalChange} />
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

type SelectArgs = {
  items: Array<SelectItem>;
  filter: string | undefined | null;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
}


function Select({items, filter, onChange}: SelectArgs) {

  const filteredItems = items.filter(i => i).filter(item => {
    if (!filter) {
      return true;
    }

    if (item.value) {
      return item.value.includes(filter);
    }

    return true;
  });

  const listItems = filteredItems.map(
    item => <option key={item.key} value={item.key}>{item.value}</option>
  );

  return <Form.Select
      className='dual-select mt-2' multiple
      onChange={onChange}>
    {listItems}
  </Form.Select>
}


export default DualSelect;
