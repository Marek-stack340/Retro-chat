# Oddych Chat — New

Oddych chat is a retro-themed multi-user chat web app built with Node.js, Express, Socket.io, and a minimal frontend.

Run locally
```
npm install
npm start
```

Then open http://localhost:3000

Docker / Google Cloud Run

This repository includes a `Dockerfile` and `cloudbuild.yaml` to deploy the app on Google Cloud Run.

Build and push using Cloud Build

```
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/oddych-chat
```

Deploy to Cloud Run

```
gcloud run deploy oddych-chat --image gcr.io/YOUR_PROJECT_ID/oddych-chat --platform managed --region YOUR_REGION --allow-unauthenticated
```

Notes
- The app uses `sqlite3` by default — consider switching to Cloud SQL for production.
- If you need to restore previous project files, see `README.old.md` and `package.old.json`.
