# Viewer

## Start it

To start dev server from monorepo root folder run following command:

```
yarn workspace @papermerge/viewer dev
```

## Where it is used?

This package is used by Papermerge UI: `<monorepo-root>/apps/ui`

## Requirements

This package code was testwd with:

```
node --version
v20.13.1
```

```
yarn --version
4.9.1
```

## How it was created?

This Package was created as follows

1. cd /path/to/your/monorepo
2. mkdir -p packages/viewer
3. cd packages/viewer
4. yarn init -y // I think this step is redundant
5. yarn dlx create-vite@latest . --template react-ts
6. yarn add @mantine/core @mantine/hooks react react-dom
7. yarn add -D @types/react @types/react-dom typescript vite
8. cd /path/to/your/monorepo
   yarn install
