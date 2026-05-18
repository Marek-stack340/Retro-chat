# Retro-chat

Retro-chat is a retro-themed multi-user chat web app built with Node.js, Express, Socket.io, SQLite, and vanilla frontend JavaScript.

## Google Cloud Run Deployment

This repository includes a `Dockerfile` and `cloudbuild.yaml` to deploy the app on Google Cloud Run.

### Build and push using Cloud Build

1. Authenticate with Google Cloud:
   - `gcloud auth login`
   - `gcloud config set project YOUR_PROJECT_ID`

2. Build the container image with Cloud Build:
   - `gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/retro-chat`

3. Deploy to Cloud Run:
   - `gcloud run deploy retro-chat --image gcr.io/YOUR_PROJECT_ID/retro-chat --platform managed --region YOUR_REGION --allow-unauthenticated`

### Local Docker run

To test locally with Docker:

```bash
docker build -t retro-chat .
docker run -p 3000:3000 retro-chat
```

Then open `http://localhost:3000`.
