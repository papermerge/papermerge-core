# UI2

Server's REST API base url is read from `.env.development.local` file:

```
VITE_BASE_URL=http://localhost:8000/
```

In order to start in dev mode as user `admin` (without authentication)
use `VITE_REMOTE_USER` and `VITE_REMOTE_GROUPS` variables in .env.development.local` file:

```
VITE_REMOTE_USER=admin
VITE_REMOTE_GROUPS=admin
VITE_BASE_URL=http://localhost:8000/
```

Start in dev mode (on port 5173):

```
yarn dev
```
