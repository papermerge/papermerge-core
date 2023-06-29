import Pagination from 'react-bootstrap/Pagination';

type Args = {
  num_pages: number;
  active: number;
  onPageClick: (page_number: number) => void;
}

function Paginator({num_pages, active, onPageClick}: Args) {
  let items = [];
  let fill_in_ellipsis = false;

  if (num_pages <= 1) {
    return <></>;
  }

  if (active > 1) {
    items.push(
      <Pagination.Prev
        onClick={() => onPageClick(active - 1)}
        key={0} />
    );
  } else {
    items.push(
      <Pagination.Prev key={0} />
    );
  }

  for (let number = 1; number <= num_pages; number++) {
    if (number == 1 || number == num_pages || Math.abs(number - active) < 2) {
      items.push(
        <Pagination.Item
          onClick={() => onPageClick(number)}
          key={number}
          active={number === active}>
            {number}
        </Pagination.Item>,
      );
      fill_in_ellipsis = true;
    } else if (fill_in_ellipsis) {
      items.push(<Pagination.Ellipsis key={number} />);
      fill_in_ellipsis = false;
    }
  }

  if (active < num_pages) {
    items.push(
      <Pagination.Next
        onClick={() => onPageClick(active + 1)}
        key={num_pages + 1} />
    );
  } else {
    items.push(
      <Pagination.Next key={num_pages + 1} />
    );
  }

  return <div>
    <Pagination>{items}</Pagination>
  </div>;
}

export default Paginator;
