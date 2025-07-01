# Kommon.dev

## Start it

To start dev server from monorepo root folder run following command:

```
yarn workspace kommon.dev dev
```

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
2. mkdir -p apps/viewer.dev
3. cd apps/viewer.dev
4. yarn dlx create-vite@latest . --template react-ts
5. yarn add @mantine/core @mantine/hooks react react-dom
6. yarn add -D @types/react @types/react-dom typescript vite
7. cd /path/to/your/monorepo
   yarn install
