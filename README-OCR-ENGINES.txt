Formula Parse OCR — Pix2Text + Texo integration patch
=====================================================

This patch adds engine selection for:
- Browser OCR (existing Tesseract.js fallback)
- Pix2Text (uses the existing local Python service)
- Texo (browser-side Transformers.js model)

Files in this patch:
- src/App.tsx
- src/types/index.ts
- src/services/texoOcr.ts (new)
- server/index.js
- package.json
- setup-texo-model.ps1 (one-time Texo model asset setup)
- README-OCR-ENGINES.txt

Apply:
1. Extract this ZIP into the root of your existing formula-parse-ocr project and allow files to be replaced.
2. Run `npm install`, then `npm run build`.
3. Pix2Text: start your existing Flask/Pix2Text service on http://127.0.0.1:5000 with POST /recognize accepting multipart field `file` and returning JSON with `latex` (or `text`). You can override the URL with `PIX2TEXT_SERVICE_URL` in the backend environment. The Node server proxies browser requests through /api/pix2text.
4. Texo: from the project root, run `powershell -ExecutionPolicy Bypass -File .\setup-texo-model.ps1`. It downloads only the official Texo-web `models/model` directory and copies it to `public/models/model`. Then restart the app and select Texo.
5. Browser OCR remains available as a fallback. The new Pix2Text and Texo paths currently accept images only, not PDFs.

Important:
- Do not delete `.env`, `src/lib/supabase.ts`, your existing `ocr-service` folder, or other files.
- Supabase login/account features are not changed. The existing account-deletion route remains in server/index.js.
- Model weights are not bundled in this patch. Texo-web is licensed AGPL-3.0; review its license before redistributing model assets or a derivative application. Official repository: https://github.com/alephpi/Texo-web
- Pix2Text official repository: https://github.com/breezedeus/Pix2Text
- Build success verifies TypeScript/bundling, not model inference. Test each engine with a clear equation image after setup.
