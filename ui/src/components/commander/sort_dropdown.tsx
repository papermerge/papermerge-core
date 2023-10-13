import { useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';

import BiCheck from 'components/icons/check';
import { NodeSortFieldEnum, NodeSortOrderEnum, Sorting } from 'types';


type Args = {
  sort: Sorting,
  onChange: (sort: Sorting) => void;
}


export default function SortDropdown({sort, onChange}: Args) {

  const check_if = (
    value:  NodeSortOrderEnum | NodeSortFieldEnum,
    current_value: NodeSortOrderEnum | NodeSortFieldEnum
  ) => {
    if (value === current_value) {
      return <BiCheck />;
    }
    return <></>
  }

  const onSortFieldClick = (new_value: NodeSortFieldEnum) => {
    onChange({sort_field: new_value, sort_order: sort.sort_order});
  }

  const onSortOrderClick = (new_value: NodeSortOrderEnum) => {
    onChange({sort_field: sort.sort_field, sort_order: new_value});
  }

  return (
    <Dropdown className='me-2'>
    <Dropdown.Toggle variant="light">
      <i className='bi bi-sort-down' />
    </Dropdown.Toggle>

    <Dropdown.Menu>
      <Dropdown.Item onClick={() => onSortFieldClick('title')}>
          Title {check_if(sort.sort_field, 'title')}
      </Dropdown.Item>
      <Dropdown.Item
        onClick={() => onSortFieldClick('ctype')}>
          Type {check_if(sort.sort_field, 'ctype')}
      </Dropdown.Item>
      <Dropdown.Item
        onClick={() => onSortFieldClick('updated_at')}>
          Modified {check_if(sort.sort_field, 'updated_at')}
      </Dropdown.Item>
      <Dropdown.Item
        onClick={() => onSortFieldClick('created_at')}>
          Created {check_if(sort.sort_field, 'created_at')}
      </Dropdown.Item>
      <Dropdown.Divider />
      <Dropdown.Item
        onClick={() => onSortOrderClick('asc')}>
          Ascending {check_if(sort.sort_order, 'asc')}
      </Dropdown.Item>
      <Dropdown.Item
        onClick={() => onSortOrderClick('desc')}>
          Descending {check_if(sort.sort_order, 'desc')}
      </Dropdown.Item>
    </Dropdown.Menu>
  </Dropdown>
  );
}
