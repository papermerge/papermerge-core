import Dropdown from 'react-bootstrap/Dropdown';

import BiCheck from 'components/icons/check';
import { NodeSortFieldEnum, NodeSortOrderEnum } from 'types';


type Args = {
  sort_order: NodeSortOrderEnum,
  sort_field: NodeSortFieldEnum,
  onSortOrderChange: (sort_order: NodeSortOrderEnum) => void;
  onSortFieldChange: (sort_field: NodeSortFieldEnum) => void;
}


export default function SortDropdown({
  sort_order,
  sort_field,
  onSortFieldChange,
  onSortOrderChange
}: Args) {


  const check_if = (
    value:  NodeSortOrderEnum | NodeSortFieldEnum,
    current_value: NodeSortOrderEnum | NodeSortFieldEnum
  ) => {
    if (value === current_value) {
      return <BiCheck />;
    }
    return <></>
  }

  return (
    <Dropdown className='me-2'>
    <Dropdown.Toggle variant="light">
      <i className='bi bi-sort-down' />
    </Dropdown.Toggle>

    <Dropdown.Menu>
      <Dropdown.Item
        onClick={() => onSortFieldChange(NodeSortFieldEnum.title)}>
          Title {check_if(sort_field, NodeSortFieldEnum.title)}
      </Dropdown.Item>
      <Dropdown.Item
        onClick={() => onSortFieldChange(NodeSortFieldEnum.type)}>
          Type {check_if(sort_field, NodeSortFieldEnum.type)}
      </Dropdown.Item>
      <Dropdown.Item
        onClick={() => onSortFieldChange(NodeSortFieldEnum.updated_at)}>
          Modified {check_if(sort_field, NodeSortFieldEnum.updated_at)}
      </Dropdown.Item>
      <Dropdown.Item
        onClick={() => onSortFieldChange(NodeSortFieldEnum.created_at)}>
          Created {check_if(sort_field, NodeSortFieldEnum.created_at)}
      </Dropdown.Item>
      <Dropdown.Divider />
      <Dropdown.Item
        onClick={() => onSortOrderChange(NodeSortOrderEnum.asc)}>
          Ascending {check_if(sort_order, NodeSortOrderEnum.asc)}
      </Dropdown.Item>
      <Dropdown.Item
        onClick={() => onSortOrderChange(NodeSortOrderEnum.desc)}>
          Descending {check_if(sort_order, NodeSortOrderEnum.desc)}
      </Dropdown.Item>
    </Dropdown.Menu>
  </Dropdown>
  );
}
