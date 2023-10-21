import MoveStrategy from './MoveStrategy';
import InsertAt from './InsertAt';
import { InsertAtType, MoveStrategyType } from './types';


type Args = {
  move_strategy: MoveStrategyType;
  onStrategyChange: (arg: MoveStrategyType) => void;
  onInsertAtChange: (arg: InsertAtType) => void;
}


function MoveOptions({
  move_strategy,
  onStrategyChange,
  onInsertAtChange
}: Args) {

  if (move_strategy == 'replace') {
    return <div className='pt-1'>
      <div>
        <MoveStrategy onChange={onStrategyChange} />
      </div>
    </div>;
  }

  return <div className='pt-1'>
    <div>
      <MoveStrategy onChange={onStrategyChange} />
    </div>
    <div className='pt-1'>
      <InsertAt onChange={onInsertAtChange} />
    </div>
  </div>;
}

export default MoveOptions;
