import { useDocumentThumbnailPolling } from '@papermerge/hooks';
import { useState } from 'react';
import './App.css';

function App() {
  const [docIDs, setDocIDs] = useState<Array<string>>([])
  const {previews, error} = useDocumentThumbnailPolling({
    url: "http://localhost:8000/api/previews",
    docIDs: docIDs,
    maxRetries: 3,
    pollIntervalSeconds: 3,
    headers: {}
  })
  const previewComponents = previews?.map(p => <>
    <div key={p.doc_id}>{p.doc_id}</div>
    <div>{p.status}</div>
    <div>{p.url}</div>
  </>)


  return (
    <>
      <h1>Polling Thumbnail Dev Tool</h1>
      <div className="card">
        <button onClick={() => setDocIDs(["d1", "d2", "d3"])}>
          switch to view with d1, d2, d3
        </button>
        <button onClick={() => setDocIDs([])}>
          switch to view without docs
        </button>
      </div>
      <p>
        {`error=${error}`}
        {previewComponents}
      </p>
    </>
  )
}

export default App
