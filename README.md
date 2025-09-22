# Prokerala Proxy for Vercel

This is a simple serverless proxy to safely connect to Prokerala API from the browser without exposing secrets.

## Setup

1. Clone this repo or upload it to GitHub.
2. Import the repo into Vercel.
3. In Vercel project settings, add environment variables:
   - `PROKERALA_CLIENT_ID`
   - `PROKERALA_CLIENT_SECRET`
4. Deploy.

Your proxy endpoint will be at:
```
https://your-project-name.vercel.app/api/prokerala
```
