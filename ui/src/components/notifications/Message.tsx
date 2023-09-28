import Toast from 'react-bootstrap/Toast';

type Args = {
  text: string;
}

function Message({text}: Args) {
  return (
      <Toast>
        <div className='d-flex'>
          <div className='toast-body'>
            {text}
          </div>
          <button type="button" className="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </Toast>
  );
}

export default Message;
