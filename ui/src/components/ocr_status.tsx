import type { OcrStatusType } from "types";


function OcrStatus({status}: OcrStatusType) {
  if (status == "RECEIVED") {
    return (
      <svg className="ocr_status received" width="16" height="16" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="5"/>
      </svg>
    );
  }

  if (status == "STARTED") {
    return  (
      <svg className="ocr_status started" width="16" height="16" fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <path opacity=".5" d="M8 15A7 7 0 108 1a7 7 0 000 14v0z" stroke="orange" strokeWidth="2"></path>
        <path d="M15 8a7 7 0 01-7 7" stroke="orange" strokeWidth="2"></path>
        <path d="M8 12a4 4 0 100-8 4 4 0 000 8z" fill="orange"></path>
      </svg>
    );
  }

  if (status == "SUCCESS") {
    return (
      <svg className="ocr_status succeeded" width="16" height="16" viewBox="0 0 16 16">
        <path fillRule="evenodd" d="M8 16A8 8 0 108 0a8 8 0 000 16zm3.78-9.72a.75.75 0 00-1.06-1.06L6.75 9.19 5.28 7.72a.75.75 0 00-1.06 1.06l2 2a.75.75 0 001.06 0l4.5-4.5z"> </path>
      </svg>
    );
  }

  if (status == "FAILURE") {
    return (
      <svg className="ocr_status failed" width="16" height="16" viewBox="0 0 16 16" version="1.1">
        <path fillRule="evenodd" d="M2.343 13.657A8 8 0 1113.657 2.343 8 8 0 012.343 13.657zM6.03 4.97a.75.75 0 00-1.06 1.06L6.94 8 4.97 9.97a.75.75 0 101.06 1.06L8 9.06l1.97 1.97a.75.75 0 101.06-1.06L9.06 8l1.97-1.97a.75.75 0 10-1.06-1.06L8 6.94 6.03 4.97z"> </path>
      </svg>
    );
  }

  return (
    <svg className="ocr_status unknown" width="16" height="16" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="5"/>
    </svg>
  );
}


export default OcrStatus;
