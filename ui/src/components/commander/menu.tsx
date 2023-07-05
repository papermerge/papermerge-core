import Button from 'react-bootstrap/Button';
import UploadButton from '../upload_button';

import type { NodeType } from 'types';

type Args = {
  onCreateDocumentNode: (node: NodeType[]) => void;
  onNewFolderClick: () => void;
  onRenameClick: () => void;
  onDeleteNodesClick: () => void;
  onEditTagsClick: () => void;
  selected_nodes: Array<string>;
  node_id: string; // current node id
}

function Menu({
  onCreateDocumentNode,
  onNewFolderClick,
  onDeleteNodesClick,
  onRenameClick,
  onEditTagsClick,
  selected_nodes,
  node_id
}: Args) {

  const upload = <UploadButton node_id={node_id} onCreateDocumentNode={onCreateDocumentNode} />;

  const new_folder = <Button variant='light' onClick={() => onNewFolderClick()}>
      <i className="bi bi-folder-plus"></i>
    </Button>;
  const delete_nodes = <Button variant='danger' onClick={() => onDeleteNodesClick()}>
    <i className="bi bi-trash"></i>
  </Button>;
  const rename_node = <Button variant='light' onClick={() => onRenameClick()}>
    <i className="bi bi-pencil"></i>
  </Button>;
  const edit_tags = <Button variant='light' onClick={() => onEditTagsClick()}>
    <i className='bi bi-tag'></i>
  </Button>

  if (selected_nodes.length > 1) {
    return <div>
      {delete_nodes}
    </div>
  }

  if (selected_nodes.length == 1) {
    return <div>
      {rename_node}
      {edit_tags}
      {delete_nodes}
    </div>
  }

  return <div>
    {upload}
    {new_folder}
  </div>
}

export default Menu;
