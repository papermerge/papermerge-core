import Dropdown from 'react-bootstrap/Dropdown';
import BiGrid from '../icons/grid';
import { DisplayNodesModeEnum } from '../../types';
import BiCheck from '../icons/check';

type Args = {
  onNodesDisplayModeList: () => void;
  onNodesDisplayModeTiles: () => void;
  value: DisplayNodesModeEnum;
}

function DisplayModeDropown({
  value,
  onNodesDisplayModeList,
  onNodesDisplayModeTiles
}: Args) {

  const check_if = (current_value: DisplayNodesModeEnum) => {
    if (value === current_value) {
      return <BiCheck />;
    }
    return <></>
  }

  return (
    <Dropdown className='me-2'>
      <Dropdown.Toggle variant="light">
        <BiGrid />
      </Dropdown.Toggle>

      <Dropdown.Menu>
        <Dropdown.Item onClick={onNodesDisplayModeList}>
          List {check_if(DisplayNodesModeEnum.List)}
        </Dropdown.Item>
        <Dropdown.Item onClick={onNodesDisplayModeTiles}>
          Tiles {check_if(DisplayNodesModeEnum.Tiles)}
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default DisplayModeDropown;
