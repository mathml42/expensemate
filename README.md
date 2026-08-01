# ExpenseMate

ExpenseMate is a modern full-stack web application designed to help users keep track of money owed between each other. It acts as a simple ledger where users manually record transactions, which require approval from the other party before affecting balances.

## Key Features

-   **User Authentication**: Secure login with JWT tokens.
-   **User Roles**: Differentiated access for Admin and regular Users.
-   **Admin Panel**:
    -   Create, activate/deactivate users.
    -   Reset user passwords.
-   **Transaction Management**:
    -   Create new transactions (specifying who paid for whom).
    -   Transactions require approval from the other party.
    -   Edit/delete own transactions (editing approved transactions reverts status to pending).
    -   Soft deletion with reasons.
-   **Pending Approvals**: Dedicated section for users to approve or reject transactions awaiting their review.
-   **Dashboard**:
    -   Overview of Net Balance, Total To Receive, and Total To Pay.
    -   List of balances with individual users (green for owed to you, red for you owe).
-   **Person Details Page**: View transaction history and current balance with a specific user.
-   **Audit Log**: Records important actions for transparency and accountability.

## Tech Stack

-   **Frontend**: React, TypeScript, Vite, Tailwind CSS, React Router, Axios
-   **Backend**: FastAPI, SQLAlchemy, SQLite, JWT authentication, Pydantic
-   **Database**: SQLite (local development), abstracted for future flexibility

## Project Structure

```text
expensemate/
  backend/
    app/
      api/
      core/
      db/
      models/
      schemas/
      services/
      main.py
    tests/
    .env.example
    requirements.txt
  frontend/
    src/
      api/
      components/
      config/
      hooks/
      layouts/
      pages/
      routes/
      styles/
      types/
    .env.example
    package.json
  README.md
```

## Setup and Installation

### Prerequisites

-   Python 3.9+
-   Node.js 18+
-   npm

### Backend Setup

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Create and activate a Python virtual environment:
    ```bash
    python -m venv .venv
    source .venv/bin/activate  # On Windows, use `.venv\Scripts\activate`
    ```
3.  Install Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Copy the example environment file and configure it. You can modify database URL, secret keys, etc.
    ```bash
    cp .env.example .env
    ```
    (Ensure `DATABASE_URL` is set to `sqlite:///./expensemate.db` for local development.)

### Frontend Setup

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install Node.js dependencies:
    ```bash
    npm install
    ```
3.  Copy the example environment file:
    ```bash
    cp .env.example .env
    ```
    (Ensure `VITE_API_BASE_URL` matches your backend address, e.g., `http://localhost:8000/api/v1`.)

## How to Run the Application

### 1. Start the Backend

From the `backend` directory (with virtual environment activated):
```bash
uvicorn app.main:app --reload
```
The backend will run at `http://localhost:8000` by default.

### 2. Start the Frontend

From the `frontend` directory:
```bash
npm run dev
```
The frontend will run at `http://localhost:5173` by default.

Open your browser and navigate to `http://localhost:5173`.

## Default Admin Credentials

The backend automatically creates an initial admin account if one doesn't exist when the application starts.

-   **Email**: `admin@example.com`
-   **Password**: `ChangeMe123!`

**Important**: Change these values in `backend/.env` before deploying to production or outside local development.
