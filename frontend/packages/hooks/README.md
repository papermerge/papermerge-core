# Hooks.Dev


Start local frontend server:

```
yarn dev
```


## useDocumentThumbnailPolling

Server example to test `useDocumentThumbnailPolling`:

```python
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Query
from typing import List

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # or ["*"] to allow all origins (not recommended for production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

counter = 1


@app.get("/api/previews")
async def root(doc_ids: List[str] = Query()):
  global counter

  result = []
  if counter % 4 != 0:
    for doc_id in doc_ids:
      result.append({
        'doc_id': doc_id,
        'status': 'pending',
        'preview_image_url': None
      })
  else:
    for doc_id in doc_ids:
      result.append({
        'doc_id': doc_id,
        'status': 'ready',
        'preview_image_url': f'http://image-cdn/{doc_id}/sm.jpg'
      })

  counter += 1

  return result
```
