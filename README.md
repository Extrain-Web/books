# Bichitra Point

Monorepo for **Bichitra Point** — an online marketplace in Bangladesh.

This repository contains both the frontend and backend of the project:

| Folder | Description | Stack |
| --- | --- | --- |
| [`bichitrapoint_client`](./bichitrapoint_client) | Frontend web app | Next.js 16, React 19, Tailwind CSS v4, Redux Toolkit / RTK Query |
| [`bichitrapoint_Server`](./bichitrapoint_Server) | Backend REST API | Express, TypeScript, MongoDB / Mongoose, JWT, Cloudinary |

## Getting Started

Each project has its own dependencies and `.env`. Copy each `.env.example` to `.env` (server) / `.env.local` (client) and fill in your own values before running.

### Backend — `bichitrapoint_Server`

```bash
cd bichitrapoint_Server
npm install
npm run start:dev   # ts-node-dev, port 5001
```

### Frontend — `bichitrapoint_client`

```bash
cd bichitrapoint_client
npm install
npm run dev -- -p 3005
```

Then open [http://localhost:3005](http://localhost:3005). Set `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:5001/api`) in the client's `.env.local`.

## Environment & Secrets

Real `.env` files are **git-ignored** and must never be committed — only the `.env.example` templates live in the repo.
