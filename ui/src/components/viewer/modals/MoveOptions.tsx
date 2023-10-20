import MoveStrategy from './MoveStrategy';
import InsertAt from './InsertAt';


function MoveOptions() {
  return <div className='pt-1'>
    <div>
      <MoveStrategy />
    </div>
    <div className='pt-1'>
      <InsertAt />
    </div>
  </div>;
}

export default MoveOptions;
