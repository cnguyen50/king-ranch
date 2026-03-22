# King Ranch 

A simple auction platform for livestock and equipment.

---

## Getting Started

### 1. Clone the repo

```bash
git clone <repo-url>
cd king-ranch
```

---

## Backend (Node + Express)

```bash
cd backend
npm install
node src/server.js
```

Backend runs on:

```
http://localhost:3001
```

---

## Frontend (React)

Open a new terminal:

```bash
cd frontend
npm install
npm start
```

Frontend runs on:

```
http://localhost:3000
```

---

## Pull Latest Changes

```bash
git pull origin main
```

If dependencies changed, reinstall:

```bash
cd backend && npm install
cd ../frontend && npm install
```

---

## Notes

* Run backend before frontend
* Do NOT commit `node_modules`
* If something breaks, try restarting both servers
