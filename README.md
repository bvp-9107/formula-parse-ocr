# FormulaParse OCR

FormulaParse OCR converts uploaded or camera-captured notes into editable text and equation blocks, with browser OCR, optional Gemini image recognition using the user's own API key, LaTeX previews, and Word export.

## Run locally

Requirements: Node.js 18+.

```bash
npm install
cp .env.example .env # if you create the environment file described below
npm run dev
```

For Gemini BYOK recognition, run `npm run server` in a second terminal and configure the backend proxy for your deployment. The user's key is sent only to this app's `/api/recognize` or `/api/test-key` endpoints when those actions are requested; the current client stores the key in browser localStorage. Do not use this on shared devices. Avoid logging request headers. Do not configure a shared `GEMINI_API_KEY` for a public deployment if the product requirement is strictly BYOK. The server supports `GEMINI_MODEL` to select a model available to the user's key.

## Supabase authentication setup

The app uses Supabase Auth for email/password only. Google sign-in has been removed, so no Google OAuth client or provider configuration is required. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, enable Email/Password, and configure email confirmation and password-reset URLs in Supabase. The current repository contains fallback Supabase project values for compatibility; replace them with your own project settings before production deployment. Configure Supabase Auth Hooks / a trusted server-side auth event integration and an email provider to send login-security notification emails. This notification delivery is **not configured by this frontend alone** and must be set up and tested in the Supabase project.

## Build and test

```bash
npm run build
npm run server
```

Browser OCR uses Tesseract.js, which is general-purpose OCR and is not a dedicated handwritten-math recognizer. It can misread mathematical symbols, exponents, and spatial structure; users should review output before exporting. Gemini may improve some cases but is not guaranteed to be correct. The guest scan counter is stored in localStorage, which is suitable for a lightweight client-side experience but is not tamper-resistant; enforce limits server-side if abuse prevention is required.

Camera access requires browser permission and a secure context (HTTPS or localhost). Word cursor insertion requires a supported Office add-in host; outside Word, the app copies content for pasting.

## Remaining deployment requirements

- Configure and test Supabase credentials, email/password authentication, password reset, and auth-triggered login notification emails.
- Configure the Gemini model and verify it is currently available for the user's API key.
- For production-grade guest quotas, move completed-scan accounting to a trusted backend.
- Browser OCR cannot guarantee perfect handwritten equation recognition; validate with a representative test set.

## Settings access

Settings are shown only for an authenticated session and open as a dedicated full-page view. Guests are prompted to sign in instead.


## Account settings update notes
- Account Settings now includes a visible Log out action.
- Password changes now ask for the current password, new password, and confirmation, validate matching passwords, and verify the current password with Supabase before updating it.
- Account deletion intentionally does **not** delete the account yet. The UI verifies the current password but stops safely because a genuine email-confirmation deletion flow still needs a server-side one-time confirmation token, delivery configuration, and deployment secrets. Do not add a Supabase service-role/secret key to any `VITE_` variable or frontend file.
- Supabase's default email service has sending limits; configure custom SMTP in Supabase Auth settings for more reliable email delivery.

## Email-confirmed account deletion setup

Account deletion now requires the user to enter their current password, then click a short-lived confirmation link sent to the account email. The account is not deleted when the request button is pressed; it is deleted only when the signed confirmation link is opened.

Configure these variables in the **Node backend's** `.env` file (never use `VITE_` prefixes for secrets):

- `SUPABASE_URL`: your Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: your Supabase service-role key. Keep it private and only on the server.

Resend requires a verified sender/domain and may restrict recipients while the account is in testing mode. If email delivery fails, the app displays an error and does not delete the account. Confirmation links expire after 30 minutes. Do not expose any backend secret in frontend environment variables or commit a real `.env` file.



### Local development and account deletion

Run `npm run dev` to start both the Vite frontend and the API backend. Vite uses port 3000 when available (or another available port); the API backend defaults to port 3002.

For account deletion to work, configure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in a root `.env` file for the Node backend. Keep the service-role key server-side only; never use a `VITE_` prefix for it. The delete endpoint re-authenticates the user token and deletes that authenticated user from Supabase Auth. Rows in any separate application tables must use a user-id foreign key with `ON DELETE CASCADE` or be explicitly deleted by the backend.
