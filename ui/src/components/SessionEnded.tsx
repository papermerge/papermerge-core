import { Button } from "react-bootstrap"


const SessionEnd= () => {
  const onClickGoToLogin = () => {
    window.location.reload();
  }

  return <div>
    <div className="px-2">Session ended</div>
    <Button onClick={onClickGoToLogin}>Go to Login view</Button>
  </div>
}


export default SessionEnd
