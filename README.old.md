# Oddych chat

Oddych chat is a retro-themed multi-user chat web app built with Node.js, Express, Socket.io, SQLite, and vanilla frontend JavaScript.

## Google Cloud Run Deployment

This repository includes a `Dockerfile` and `cloudbuild.yaml` to deploy the app on Google Cloud Run.

### Build and push using Cloud Build

1. Authenticate with Google Cloud:
   - `gcloud auth login`
   - `gcloud config set project YOUR_PROJECT_ID`

2. Build the container image with Cloud Build:
   - `gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/oddych-chat`

3. Deploy to Cloud Run:
   - `gcloud run deploy oddych-chat --image gcr.io/YOUR_PROJECT_ID/oddych-chat --platform managed --region YOUR_REGION --allow-unauthenticated
   fetch(window.location.href)
  .then(response => {
    console.log('Response status:', response.status);
    if (!response.ok) {
      return response.text().then(text => {
        console.log('Response body:', text);
      });
    } else {
      console.log('Page loaded successfully');
    }
  })
  .catch(error => {
    console.error('Fetch error:', error);
  });

### Local Docerr run

To test locally with Docker:

```bash
docker build -t oddych-chat .
docker run -p 3000:3000 oddych-chat
```

Then open `http://localhost:3000`.

### GitHub Actions for automatic deploy

This repo includes a GitHub Action workflow at `.github/workflows/gcloud-deploy.yml`.

Set these repository secrets in GitHub:
- `GCP_PROJECT` — your Google Cloud project ID
- `GCP_REGION` — Cloud Run region, e.g. `us-central1`
- `GCP_SA_KEY` — service account key JSON with Cloud Build and Cloud Run permissions

When you push to `main`, the workflow will build the container and deploy it to Google Cloud Run.

## GitHub Actions Deployment

A GitHub workflow is included to automatically deploy the app to Google Cloud Run on every push to `main`.

### Repository secrets required

- `GCP_PROJECT` — your Google Cloud project ID
- `GCP_REGION` — your Cloud Run region (for example `us-central1`)
- `GCP_SA_KEY` — JSON service account key with Cloud Run, Cloud Build, and Artifact Registry permissions

### Use the workflow

1. Create a Google Cloud service account with:
   - Cloud Run Admin
   - Cloud Build Editor
   - Storage Admin (or Artifact Registry Writer)
   - Service Account User

2. Download the JSON key and add it as a secret named `GCP_SA_KEY`.
3. Set `GCP_PROJECT` and `GCP_REGION` in GitHub repository secrets.
4. Push to `main`.

The workflow will build the container and deploy it to Cloud Run automatically.
