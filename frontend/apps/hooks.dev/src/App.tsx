import { useDocumentThumbnailPolling } from '@papermerge/hooks';
import { useState } from 'react';
import './App.css';

function App() {
  const [docIDs, setDocIDs] = useState<Array<string>>([])
  const {previews, error, isPolling, pollingDocIDs} = useDocumentThumbnailPolling({
    url: "http://localhost:8000/api/previews",
    docIDs: docIDs,
    maxRetries: 5,
    pollIntervalSeconds: 3,
    headers: {}
  })
  const previewComponents = previews?.map(p => <>
    <div>
      <span key={p.doc_id}>doc_id: {p.doc_id}</span>
      <span> status: {p.status} </span>
      <span> url: {p.url} </span>
    </div>
  </>)


  return (
    <>
      <h1>Polling Thumbnail Dev Tool</h1>
      <div className="card">
        <button onClick={() => setDocIDs(["d1", "d2", "d3"])}>
          switch to view with d1, d2, d3
        </button>
        <button onClick={() => setDocIDs(["d4", "d5"])}>
          switch to view with d4, d5
        </button>
        <button onClick={() => setDocIDs([])}>
          switch to view without docs
        </button>
      </div>
      <p>
        {`isPolling=${isPolling}`}
      </p>
      <p>
        {`pollingDocIDs=${pollingDocIDs}`}
      </p>
      <p>
        {`error=${error}`}
      </p>
      <p>
        previewsComponents={previewComponents}
      </p>
    </>
  )
}

export default App
