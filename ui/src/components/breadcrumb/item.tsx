type Args = {
  node_id: string;
  node_title: string
  onClick: (node_id: string) => void;
}

export default function BreadcrumbItem({node_id, node_title, onClick}: Args) {
  return (
    <li>
      <button className="btn btn-link" onClick={() => onClick(node_id)}>
        {node_title}
      </button>
    </li>
  )
}