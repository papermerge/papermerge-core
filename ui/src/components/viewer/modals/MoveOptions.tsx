import MoveStrategy from './MoveStrategy';
import { MoveStrategyType } from './types';


type Args = {
  onStrategyChange: (arg: MoveStrategyType) => void;
}


function MoveOptions({
  onStrategyChange
}: Args) {

  return <div className='pt-1'>
      <MoveStrategy onChange={onStrategyChange} />
    </div>

}

export default MoveOptions;
