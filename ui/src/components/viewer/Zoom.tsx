import './Zoom.scss'

type Args = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
}

const Zoom = ({onZoomIn, onZoomOut, onZoomFit}: Args) => {

  return <div className="zoom d-flex justify-content-center">
      <div>
        <i className="bi bi-zoom-in px-1" onClick={onZoomIn}></i>
      </div>
      <div>
        <i className="bi bi-zoom-out px-1" onClick={onZoomOut}></i>
      </div>
      <div className="px-1" onClick={onZoomFit}>
        Fit
      </div>
    </div>
}

export default Zoom;
