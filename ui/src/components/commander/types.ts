import { NodeType, DisplayNodesModeEnum, NodeClickArgsType } from 'types' ;

type NodeArgsType = {
  node: NodeType;
  onClick: ({node_id, node_type}: NodeClickArgsType) => void;
  onSelect: (node_id: string, selected: boolean) => void;
  onDragStart: (node_id: string, event: React.DragEvent) => void;
  onDrag: (node_id: string, event: React.DragEvent) => void;
  is_loading: boolean;
  is_selected: boolean;
  display_mode: DisplayNodesModeEnum;
}

type CheckboxChangeType = React.ChangeEvent<HTMLInputElement>;

export type { NodeArgsType, CheckboxChangeType };
