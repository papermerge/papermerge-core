
function SpinnerPlaceholder() {
  return(
    <>
      <span
        className="spinner-border spinner-border-sm me-1 text-primary"
        role="status"
        aria-hidden="true" style={{visibility: 'hidden'}}>
      </span>
    </>
  );
}

export default SpinnerPlaceholder;