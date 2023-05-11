import { NodeClickArgsType } from "@/types";
import Breadcrumb from '../breadcrumb/breadcrumb';

type Args = {
  node_id: string;
  onNodeClick: ({node_id, node_type}: NodeClickArgsType) => void;
}

export default function Viewer(
  {node_id, onNodeClick}:  Args
) {

  let path_items: Array<[string, string]> = [
    ["id1", "Folder1"],
    ["id2", "Folder 2"],
    ["id3", "Folder 3"]
  ];

  return <>
    <Breadcrumb path={path_items} onClick={onNodeClick} is_loading={false} />
    <div>
      I am viewer
    </div>
  </>;
}
