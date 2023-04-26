import Pagination from 'react-bootstrap/Pagination';

type Args = {
  num_pages: number;
  active: number;
  onPageClick: (page_number: number) => void;
}

function Paginator({num_pages, active, onPageClick}: Args) {
  let items = [];

  if (num_pages <= 1) {
    return <></>;
  }

  for (let number = 1; number <= num_pages; number++) {
    items.push(
      <Pagination.Item
        onClick={() => onPageClick(number)}
        key={number}
        active={number === active}>
          {number}
      </Pagination.Item>,
    );
  }

  return <div>
    <Pagination>{items}</Pagination>
  </div>;
}

export default Paginator;