import React from 'react';


function ErrorMessage({msg}: {msg: string}) {

  return <div>
    Following error occured while rendering nodes:
      <div className='text-danger'>
        {msg}
      </div>
  </div>
}

export default ErrorMessage;
