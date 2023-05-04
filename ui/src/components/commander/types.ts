import { DisplayNodesModeEnum } from '../../types' ;

type NodeArgsType = {
  node: any;
  onClick: (node_id: string) => void;
  onSelect: (node_id: string, selected: boolean) => void;
  onDragStart: (node_id: string, event: React.DragEvent) => void;
  onDrag: (node_id: string, event: React.DragEvent) => void;
  onDragEnd: (node_id: string, event: React.DragEvent) => void;
  is_loading: boolean;
  is_selected: boolean;
  display_mode: DisplayNodesModeEnum;
}

type CheckboxChangeType = React.ChangeEvent<HTMLInputElement>;

export type { NodeArgsType, CheckboxChangeType };