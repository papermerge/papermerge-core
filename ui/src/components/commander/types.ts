import { NodeType, DisplayNodesModeEnum, NType, NodeClickArgsType } from 'types' ;

type NodeArgsType = {
  node: NodeType;
  onClick: (node: NType) => void;
  onSelect: (node_id: string, selected: boolean) => void;
  onDragStart: (node_id: string, event: React.DragEvent) => void;
  onDrag: (node_id: string, event: React.DragEvent) => void;
  is_loading: boolean;
  is_selected: boolean;
  is_being_dragged: boolean;
  display_mode: DisplayNodesModeEnum;
}

type CheckboxChangeType = React.ChangeEvent<HTMLInputElement>;

export type { NodeArgsType, CheckboxChangeType };
