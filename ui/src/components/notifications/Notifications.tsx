import ToastContainer from 'react-bootstrap/ToastContainer';
import Message from './Message';


function NotificationsContainer() {
  return (
    <ToastContainer position='bottom-end'>
      <Message text={"Message 1"} />
      <Message text={"Message 2"} />
      <Message text={"Message 3"} />
    </ToastContainer>
  );
}

export default NotificationsContainer;
