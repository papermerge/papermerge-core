import Dropdown from 'react-bootstrap/Dropdown';


export default function SortDropdown() {
  return (
    <Dropdown className='me-2'>
    <Dropdown.Toggle variant="light">
      <i className='bi bi-sort-down' />
    </Dropdown.Toggle>

    <Dropdown.Menu>
      <Dropdown.Item>Title</Dropdown.Item>
      <Dropdown.Item>Type</Dropdown.Item>
      <Dropdown.Item>Modified</Dropdown.Item>
      <Dropdown.Item>Created</Dropdown.Item>
      <Dropdown.Divider />
      <Dropdown.Item>Ascending</Dropdown.Item>
      <Dropdown.Item>Descending</Dropdown.Item>
    </Dropdown.Menu>
  </Dropdown>
  )
}
