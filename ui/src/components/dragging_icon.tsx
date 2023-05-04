import type { UUIDList, NodeList, NodeType } from '../types';
import { default as FolderIcon } from "./icons/folder";
import { default as FileIcon } from "./icons/file";


type Args = {
  node_id: string;
  selectedNodes: UUIDList;
  nodesList: NodeList;
}

export function DraggingIcon({node_id, selectedNodes, nodesList}: Args) {

  let image: JSX.Element;
  let count = selectedNodes.length;
  let folder_only_dragging = true;
  let node: NodeType | undefined;

  // When both folder and documents are being dragged
  // a generic <FileIcon /> will be used.
  // When only folders are dragged - <FolderIcon /> will
  // be used
  selectedNodes.forEach(selected_id => {
    let sel_node = nodesList.find(i => i.id == selected_id);
    if (sel_node && sel_node.ctype == 'document') {
      folder_only_dragging = false;
    }
  });

  node = nodesList.find(i => i.id == node_id);

  if (node && node.ctype == 'document') {
    folder_only_dragging = false;
  }

  if (!selectedNodes.find(i => i == node_id)) {
    count += 1;
  }

  if (folder_only_dragging) {
    image = (
      <div className="d-flex align-items-center">
        <FolderIcon />
        <div className="m-2">Move {count} item(s)</div>
      </div>
    );
  } else {
    image = (
      <div className="d-flex align-items-center">
        <FileIcon />
        <div>Move {count} item(s)</div>
      </div>
    );
  }

  return image;
}
