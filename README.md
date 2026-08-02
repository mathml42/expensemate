# ExpenseMate

ExpenseMate is a serverless web app for tracking money owed between people. Users manually record transactions, the other party approves or rejects them, and approved transactions flow into balances and activity history.

The app has been migrated away from the old Python FastAPI, SQLAlchemy, and SQLite backend. The current runtime path is a Vite, React, TypeScript frontend using Firebase Authentication and Cloud Firestore.

## Key Features

- **Firebase Authentication** for login and password management.
- **User Roles** for Admin and regular Users.
- **Admin Panel** for managing users.
- **Transaction Management** with pending, approved, and rejected states.
- **Pending Approvals** for transactions awaiting review.
- **Dashboard** with net balance, totals to receive/pay, per-user balances, and recent activity.
- **Person Details Page** for transaction history with a specific user.
- **Audit Log** for important actions.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, React Router
- **Serverless backend**: Firebase Authentication, Cloud Firestore
- **Legacy code**: The `backend/` folder contains the old FastAPI implementation for reference only.

## Project Structure

```text
expensemate/
  backend/                 # Legacy FastAPI backend, no longer required to run the app
  frontend/
    src/
      lib/firebase/        # Firebase app, Firestore collections, services
      types/               # Shared TypeScript domain models
      components/
      config/
      features/
      layouts/
      pages/
      routes/
      styles/
    .env.example
    package.json
  README.md
```

## Prerequisites

- Node.js 18+
- npm
- A Firebase project with Authentication and Cloud Firestore enabled

## Firebase Setup

1. Create or open a Firebase project in the Firebase Console.
2. Enable **Authentication** and add the **Email/Password** sign-in provider.
3. Enable **Cloud Firestore**.
4. Create a web app in Firebase project settings.
5. Copy the Firebase web config values into `frontend/.env`.

```bash
cd frontend
cp .env.example .env
```

Fill in:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## Install

From the frontend directory:

```bash
cd frontend
npm install
```

## Run Locally

From the frontend directory:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

You do not need to start the Python backend anymore.

## Build

From the frontend directory:

```bash
npm run build
```

For GitHub Pages:

```bash
npm run build:github
```

To preview the production build:

```bash
npm run preview
```

## Deploy To GitHub Pages

Build the app from `frontend/`:

```bash
npm run build:github
```

Deploy the generated `frontend/dist` folder with your preferred GitHub Pages workflow.

In Firebase Console, add your GitHub Pages domain to Authentication authorized domains:

```text
<your-github-username>.github.io
```

The app uses hash routing, so deployed routes look like:

```text
https://<your-github-username>.github.io/expensemate/#/
```

## First Admin User

The old backend created a default admin automatically. Firebase does not do that from the frontend alone.

For local development, create a user in Firebase Authentication, then add a matching document in Firestore:

```text
Collection: users
Document ID: Firebase Auth user UID
```

Example document:

```json
{
  "email": "admin@example.com",
  "full_name": "ExpenseMate Admin",
  "role": "admin",
  "is_active": true
}
```

Use that email and password to sign in.
