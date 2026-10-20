Formula Parse OCR — Gemini removal patch
==========================================

This archive contains only the project files changed for the Gemini-removal stage.

How to apply:
1. Make sure your project folder is backed up (or keep the .before-gemini-cleanup backups).
2. Extract this ZIP into the ROOT of your existing formula-parse-ocr project folder.
   Preserve folder structure and allow these five files to be replaced.
3. From PowerShell in the project folder, run:
      npm install
      npm run build
4. If the build succeeds, start your app as usual.

Files included:
- src/App.tsx
- src/components/SettingsModal.tsx
- src/types/index.ts
- server/index.js
- package.json

Important:
- Do not delete .env, src/lib/supabase.ts, ocr-service, or other project files.
- Supabase account deletion remains in server/index.js and still requires the existing server-side
  SUPABASE_SERVICE_ROLE_KEY configuration.
- npm install updates the existing package lock file to reflect the removal of @google/generative-ai.
- This patch keeps browser OCR (Tesseract.js). Texo and Pix2Text integration are not part of this patch.
