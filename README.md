# QB Transaction Manager

A production-ready web application for importing, exporting, editing, and deleting QuickBooks Online transactions — inspired by SaasAnt Transactions.

Built with **React + Vite** (frontend) and **Node.js + Express + TypeScript** (backend).

## Features

| Feature | Description |
|---------|-------------|
| **Import** | Upload Excel (.xlsx, .xls), CSV, PDF, or image files. Parse, preview, and bulk import into QuickBooks Online. |
| **Export** | Select transaction types and date ranges. Download as CSV or JSON. |
| **View & Manage** | Browse transactions by type, select multiple records, and delete in bulk. |
| **Live Edit** | Update existing QuickBooks transactions directly. |
| **Batch Operations** | Import, update, or delete multiple transactions at once. |

## Prerequisites

- **Node.js** 18+ and **npm**
- **Intuit Developer account** — free at https://developer.intuit.com
- A QuickBooks Online company (sandbox or production)

## Quick Start

### 1. Get QuickBooks API Credentials

1. Go to [Intuit Developer](https://developer.intuit.com) and create an app
2. Enable **Accounting API** and **Payment API** scopes
3. Set the redirect URI to: `http://localhost:3001/api/auth/callback`
4. Copy your **Client ID** and **Client Secret**

### 2. Configure Environment

```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your credentials:

```env
QBO_CLIENT_ID=your_actual_client_id
QBO_CLIENT_SECRET=your_actual_client_secret
QBO_REDIRECT_URI=http://localhost:3001/api/auth/callback
QBO_ENVIRONMENT=sandbox
SESSION_SECRET=generate_a_random_secret_here
```

### 3. Install & Run

```bash
# From the project root
npm run install:all

# Start both server (port 3001) and client (port 5173)
npm run dev
```

### 4. Open the App

Navigate to **http://localhost:5173** and click **"Connect to QuickBooks Online"**.

## Project Structure

```
qb-transaction-manager/
├── server/                     # Express API backend
│   ├── src/
│   │   ├── config/             # Environment & QBO config
│   │   ├── middleware/          # Auth guard & error handler
│   │   ├── routes/             # API routes (auth, txns, import, export)
│   │   ├── services/           # QBO API client, file parser, session store
│   │   └── types/              # TypeScript types
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── client/                     # React + Vite frontend
│   ├── src/
│   │   ├── api/                # HTTP client
│   │   ├── components/         # Layout, shared components
│   │   ├── contexts/           # Auth context
│   │   ├── pages/              # Dashboard, Import, Export, Transactions
│   │   └── types/              # TypeScript types
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── package.json                # Root workspace config
└── README.md
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/login` | Get QuickBooks OAuth URL |
| GET | `/api/auth/callback` | OAuth callback handler |
| GET | `/api/auth/status` | Check connection status |
| POST | `/api/auth/logout` | Disconnect from QuickBooks |
| GET | `/api/transactions/types` | List supported transaction types |
| GET | `/api/transactions` | Query transactions by type |
| POST | `/api/transactions/import` | Bulk import transactions |
| PUT | `/api/transactions/update` | Bulk update transactions |
| POST | `/api/transactions/delete` | Bulk delete transactions |
| POST | `/api/import/parse` | Upload & parse a file |
| POST | `/api/import/execute` | Execute parsed import |
| POST | `/api/export` | Export transactions |

## Tech Stack

- **Frontend:** React 18, Vite, TypeScript, React Router v6, React Dropzone, Axios, Lucide Icons
- **Backend:** Node.js, Express, TypeScript, node-quickbooks, multer, exceljs, pdf-parse, tesseract.js
- **Auth:** QuickBooks Online OAuth 2.0

## License

MIT
