import React, { useState, useRef } from 'react';

import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import './search.scss';


type ClearButtonArgs = {
  onClick: () => void;
}


type Args = {
  onSubmit: (query: string) => void;
}


function ClearButton({onClick}: ClearButtonArgs) {
  return (
    <div className="input-group-append">
      <Button
        onClick={() => onClick()}
        variant="light"
        className='flat search-clear-button'>
        <i className="bi bi-x" />
      </Button>
    </div>
  );
}

function Search({onSubmit}: Args) {
  const [value, setValue] = useState('');
  const [clearBtnIsVisible, setClearBtnIsVisible] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let new_value = event.currentTarget.value;

    if ((value || new_value).trim()) {
      setClearBtnIsVisible(true);
    }

    setValue(new_value);

    if (ref && ref.current) {
      ref.current.value = new_value;
    }
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const { key } = event;

    if (key === 'Enter') {
      onSubmit(value);
    }
  }

  const onClickClearButton = () => {
    setClearBtnIsVisible(false);
    setValue('');
    if (ref && ref.current) {
      ref.current.value = '';
    }
  }

  return (
    <div className='input-group search-panel'>
      <Button
        variant="secondary"
        className='flat search-button'>
          <i className='bi bi-search'></i>
      </Button>

      <Form.Control ref={ref}
        className='flat search-input'
        onKeyDown={onKeyDown}
        onChange={onInputChange}
        placeholder='Search documents' />

      {clearBtnIsVisible && <ClearButton onClick={onClickClearButton} />}
    </div>
  );
}

export default Search;
