# Contributing to Papermerge OSS

Thanks for your interest in contributing! Papermerge OSS (Open Source) is a self-hosted document management system for scanned documents.

This guide explains how to report issues, propose changes, and get your work merged.

> Papermerge Cloud (SaaS) ([papermerge.com](https://papermerge.com)) is managed, GoBD-compliant document management
> with professional support and is not governed by this document.

## Ways to contribute

- **Report a bug** - open an [issue](https://github.com/papermerge/papermerge-core/issues) with steps to reproduce, expected vs. actual behavior, your version, and how you deploy (Docker, source, etc.).
- **Suggest a feature** - start a thread in [Discussions](https://github.com/papermerge/papermerge-core/discussions) first. Once the idea is scoped, it can become an issue.
- **Ask a question** - use [Discussions](https://github.com/papermerge/papermerge-core/discussions) rather than issues.
- **Improve docs, translations, or tests** - always welcome, and a good way to start.
- **Fix bugs / build features** - see the workflow below.

## Development setup

> **Platforms:** these instructions cover Windows (PowerShell 7+) and Linux (bash).
>
> **Prerequisites:** [git](https://git-scm.com/downloads), [uv](https://docs.astral.sh/uv/),
> a current Node.js LTS release with [yarn](https://yarnpkg.com/), and either
> [scoop](https://scoop.sh) (Windows) or [Docker](https://docs.docker.com/engine/install/) (Linux).
> You also need a [GitHub account](https://github.com/signup) if you plan to send a pull request.

### Fork and clone the repository

1. **Fork** [papermerge/papermerge-core](https://github.com/papermerge/papermerge-core)
   using the **Fork** button on GitHub. Maintainers with write access can skip
   steps 1 and 3 and clone the main repository directly.
2. **Clone** your fork (the commands are the same on Windows and Linux):

   ```bash
   git clone https://github.com/<your-username>/papermerge-core.git
   cd papermerge-core
   ```

3. **Add the main repository as `upstream`** so you can keep your fork up to date:

   ```bash
   git remote add upstream https://github.com/papermerge/papermerge-core.git
   git fetch upstream
   ```

To sync your local `master` with the main repository later:

```bash
git switch master
git pull upstream master
```

Create a branch for your changes as described in the
[contribution workflow](#contribution-workflow).

Run the steps below from the repository root (`papermerge-core`), in a single terminal,
until you reach "Run the application".

### Backend (Python, managed with uv)

```bash
uv sync
```

`uv sync` creates the virtual environment and installs all backend dependencies in one step.

#### 1. PostgreSQL

Create the PostgreSQL database and user.

**Windows (PowerShell):**

```powershell
scoop install main/postgresql
pg_ctl start -D "$env:USERPROFILE\scoop\persist\postgresql\data" -l logfile
psql -U postgres -h 127.0.0.1 -c "CREATE USER papermerge WITH PASSWORD 'papermerge';"
psql -U postgres -h 127.0.0.1 -c "CREATE DATABASE papermerge OWNER papermerge;"
```

The default superuser is `postgres` with a blank password; press Enter at the
password prompt. To stop the database later:
`pg_ctl stop -D "$env:USERPROFILE\scoop\persist\postgresql\data"`.
To register it as a persistent Windows service instead (survives reboots,
requires an elevated shell):
`pg_ctl register -N PostgreSQL -D "$env:USERPROFILE\scoop\persist\postgresql\data"`.

> To start over with a clean database (**this deletes all existing data** in
> `papermerge`):
> `psql -U postgres -h 127.0.0.1 -c "DROP DATABASE IF EXISTS papermerge WITH (FORCE);"`

**Linux (bash):**

```bash
docker run -d --name papermerge-postgres \
  -e POSTGRES_USER=papermerge \
  -e POSTGRES_PASSWORD=papermerge \
  -e POSTGRES_DB=papermerge \
  -p 5432:5432 \
  postgres:18
```

Wait a few seconds for the container to finish starting before continuing.

#### 2. Environment variables

Create a `.env` file with the required variables and tell `uv` to load it.

**Windows (PowerShell):**

```powershell
@"
PM_DB_URL=postgresql://papermerge:papermerge@127.0.0.1:5432/papermerge
PM_API_PREFIX=/api
"@ | Set-Content -Encoding utf8NoBOM .env

$env:UV_ENV_FILE = ".env"
```

**Linux (bash):**

```bash
cat > .env <<'EOF'
PM_DB_URL=postgresql://papermerge:papermerge@127.0.0.1:5432/papermerge
PM_API_PREFIX=/api
EOF

export UV_ENV_FILE=.env
```

#### 3. Initialize the database and users

These commands are identical on both platforms. The `admin`/`admin` credentials
are for local development only.

```bash
uv run task migrate
uv run pm users create-system-user
uv run pm users create --username admin --password admin --superuser
uv run pm perms sync
uv run pm roles create-standard-roles
```

#### 4. Look up the admin user's ID

The frontend configuration needs it.

**Windows (PowerShell):**

```powershell
$userId = uv run pm users ls | Select-String '\badmin\b' |
  ForEach-Object { [regex]::Match($_.Line, '[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}').Value } |
  Select-Object -First 1
```

**Linux (bash):**

```bash
USER_ID=$(uv run pm users ls | grep -w admin \
  | grep -oE '[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}' | head -n1)
```

### Frontend (React + Vite)

The `VITE_REMOTE_*` variables simulate the identity headers a reverse proxy
would normally supply. They are for local development only.

Still in the repository root and the same terminal, create the frontend env file:

**Windows (PowerShell):**

```powershell
@"
VITE_BASE_URL=http://localhost:8000
VITE_REMOTE_USER=admin
VITE_REMOTE_USER_ID=$userId
VITE_REMOTE_GROUPS=admin
VITE_KEEP_UNUSED_DATA_FOR=1
"@ | Set-Content -Encoding utf8NoBOM frontend\apps\ui\.env.development.local
```

**Linux (bash):**

```bash
cat > frontend/apps/ui/.env.development.local <<EOF
VITE_BASE_URL=http://localhost:8000
VITE_REMOTE_USER=admin
VITE_REMOTE_USER_ID=$USER_ID
VITE_REMOTE_GROUPS=admin
VITE_KEEP_UNUSED_DATA_FOR=1
EOF
```

You may also set `VITE_REMOTE_ROLES`. `VITE_KEEP_UNUSED_DATA_FOR` controls how
long (in seconds) data returned from the backend is cached. Adjust the user ID,
username, and groups to match a user that exists in your backend.

### Run the application

You need two terminals.

**Terminal 1 - backend** (the terminal you used above, where `UV_ENV_FILE` is set;
if you open a new one, set `UV_ENV_FILE` again as shown in step 2):

```bash
uv run task server
```

The API runs on `http://localhost:8000`.
Swagger docs are at `http://localhost:8000/docs`.

**Terminal 2 - frontend:**

```bash
cd frontend
yarn install
yarn workspace ui dev
```

The UI runs on `http://localhost:5173/`.

To list all frontend workspaces:

```bash
yarn workspaces list
```

### Using a specific Python version

```bash
uv sync --python 3.14
```

### Command line interface

`pm` is the CLI for various management commands. Run it through `uv`:

```bash
uv run pm --help
```

Search index:

```bash
uv run pm search build   # clear and rebuild the search index from scratch
uv run pm search stats   # show search index statistics
```

### Run the tests

```bash
uv sync --group dev
uv run pytest
```

### Pre-commit hooks

The repository includes a `.pre-commit-config.yaml`. Install the hooks so checks run before each commit:

```bash
uv run pre-commit install
```

## Contribution workflow

1. **Check for existing work.** Search open issues and PRs to avoid duplicates. For anything non-trivial, comment on or open an issue before you start.
2. **Create a branch** from `master`:
   - Maintainers (write access): branch directly in this repository.
   - Everyone else: fork the repository and branch in your fork.
3. **Name your branch** descriptively: `fix/short-description`, `feat/short-description`, `docs/short-description`.
4. **Make focused changes.** One logical change per PR is much easier to review.
5. **Add or update tests** for behavior changes, and update docs where relevant.
6. **Run tests and pre-commit checks** locally.
7. **Open a pull request** against `master` with:
   - what changed and why
   - a link to the related issue (e.g. `Fixes #123`)
   - screenshots for UI changes
   - notes on how you tested it
8. **Respond to review feedback.** A maintainer will review as time allows; please be patient.

## Database migrations

Schema changes use Alembic (`alembic.ini`). If your change alters the data model, include a migration and mention it in the PR description.

## Commit messages

Write clear, imperative commit messages, e.g. `Fix OCR timeout on large PDFs`. Reference issues where applicable.

## Community expectations

Be respectful and constructive. Harassment, personal attacks, and discriminatory language are not tolerated in issues, pull requests, or Discussions. Maintainers may edit or remove comments, lock threads, and block repeat offenders.

A formal Code of Conduct is under discussion in the community.

## Security issues

Please do **not** report security vulnerabilities in public issues. Use the repository's **Security** tab ("Report a vulnerability") instead.

## Licensing

Papermerge OSS (Open Source) is licensed under [Apache-2.0](LICENSE). By submitting a contribution, you agree it is licensed under the same terms.

## Maintainers

See [MAINTAINERS.md](MAINTAINERS.md) for the current maintainer team and how decisions are made.
