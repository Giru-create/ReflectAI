# ReflectAI - Journal & Reflection Workspace

ReflectAI is a secure, user-authenticated journaling and reflective brainstorming application built with **Google Gemini 3.6 Flash**, **Firebase Authentication (Google Sign-In)**, and **Cloud Firestore**.

Every user reflection, brainstorm, action plan, and multi-turn conversational synthesis is isolated strictly to the authenticated user's private document path.

---

## 🛡️ Threat Model & Security Countermeasures

| Threat Zone | Potential Vulnerability / Attack Vector | Mitigation / Countermeasure Implemented |
| :--- | :--- | :--- |
| **Input Surfaces** | Malicious injection payloads, oversized bodies, prompt tampering | Strict Express payload decoding, schema filtering, input bounding, and defensive null-safe destructuring (`req.body`). |
| **Planning & Reasoning** | Prompt injection / Instruction escape | Dedicated contextual system instructions, strict separation between system directives and conversation content. |
| **Tool Execution & APIs** | API key leakage, brute-force / quota denial of service | Gemini API keys stored strictly server-side in Secret Manager / environment variables; never exposed to the client. Resilient fallback ladder (`gemini-3.6-flash` -> `gemini-3.1-flash-lite` -> `gemini-flash-latest` -> `gemini-3.7-flash`). |
| **Memory & State** | Cross-tenant data leakage, session hijacking | Owner-bound Firestore security rules (`request.auth.uid == userId`); zero-insecure defaults; automated undefined-stripping before writes. |
| **Inter-System Communication** | Token leakage, Man-in-the-Middle (MitM) | TLS 1.3 enforced by Cloud Run / Firebase; Google OAuth tokens verified on client and server boundaries. |

---

## 🔒 Cloud Firestore Security Rules

Deploy the following rules to guarantee complete user data isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/entries/{entryId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 🔑 Secret Manager Setup

Store your Gemini API key in Google Cloud Secret Manager and grant access to the Cloud Run runtime service account:

```bash
# 1. Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Grant the default Cloud Run service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 🚀 Cloud Run Deployment Flow

### Prerequisites
- Enable required Google Cloud APIs:
  ```bash
  gcloud services enable run.googleapis.com \
    secretmanager.googleapis.com \
    firestore.googleapis.com \
    identitytoolkit.googleapis.com
  ```

### Build & Deploy Command
```bash
# Deploy to Google Cloud Run
gcloud run deploy reflect-ai \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --update-labels=dev-tutorial=cloud-run-ai-challenge
```

### Apply Challenge Verification Label
```bash
gcloud run services update reflect-ai \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 🧪 Functional Verification & Walkthrough Steps

1. **Sign-In Flow**:
   - Navigate to the application root.
   - Click `Sign in with Google` on the landing page.
   - Authorize with your Google account.
   - Verify transition to the private Dashboard with your profile badge and isolated Firestore collection indicator.

2. **Multi-Turn Reflection**:
   - Select a mode (`Reflection`, `Brainstorm`, `Action Plan`, `Summary`).
   - Click one of the prompt suggestion chips or enter a custom reflection in the textarea.
   - Click `Reflect` or press `Ctrl + Enter`.
   - Verify that Gemini responds with structured Markdown feedback (insights, reflection questions, actionable steps).
   - Reply to the response to continue the multi-turn thread.

3. **Firestore Data Isolation & Persistence**:
   - Verify the `Firestore Synced` indicator updates in real-time.
   - Refresh the browser tab or sign out and back in; confirm all previous reflections and messages reload from Firestore under `/users/{userId}/entries`.

4. **History Management & Search**:
   - Create multiple reflections across different modes.
   - Search by keyword in the history sidebar.
   - Toggle filters (`Reflection`, `Brainstorm`, `Action Plan`).
   - Pin important entries and export them as Markdown.
