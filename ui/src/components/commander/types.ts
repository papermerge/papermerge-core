import { DisplayNodesModeEnum } from '../../types' ;

type NodeArgsType = {
  node: any;
  onClick: (node_id: string) => void;
  onSelect: (node_id: string, selected: boolean) => void;
  is_loading: boolean;
  is_selected: boolean;
  display_mode: DisplayNodesModeEnum;
}

type CheckboxChangeType = React.ChangeEvent<HTMLInputElement>;

export type { NodeArgsType, CheckboxChangeType };