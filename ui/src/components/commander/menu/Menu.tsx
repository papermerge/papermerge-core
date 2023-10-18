import UploadButton from './UploadButton';
import NewFolder from './NewFolder';

import type { CreatedNodesType, NodeType } from 'types';
import DeleteNodes from './DeleteNodes';
import RenameNodes from './RenameNode';
import EditTags from './EditTags';


type Args = {
  onNewFolderClick: () => void;
  onRenameClick: () => void;
  onDeleteNodesClick: () => void;
  onEditTagsClick: () => void;
  onCreatedNodesByUpload: (created_nodes: CreatedNodesType) => void;
  selected_nodes: Array<string>;
  node_id: string; // current node id
}

function Menu({
  onNewFolderClick,
  onDeleteNodesClick,
  onRenameClick,
  onEditTagsClick,
  onCreatedNodesByUpload,
  selected_nodes,
  node_id
}: Args) {

  const upload = <UploadButton node_id={node_id} onCreatedNodesByUpload={onCreatedNodesByUpload} />;
  const new_folder = <NewFolder onClick={onNewFolderClick} />;
  const delete_nodes = <DeleteNodes onClick={onDeleteNodesClick} />;
  const rename_node = <RenameNodes onClick={onRenameClick} />;
  const edit_tags = <EditTags onClick={onEditTagsClick} />;

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
