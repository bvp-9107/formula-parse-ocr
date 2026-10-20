import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, '../dist');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ success: true });
});

app.post('/api/pix2text', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded.' });
  }

  const serviceUrl =
    process.env.PIX2TEXT_SERVICE_URL ||
    'http://127.0.0.1:5000/recognize';

  try {
    const form = new FormData();
    form.append(
      'file',
      new Blob([req.file.buffer], {
        type: req.file.mimetype || 'image/png'
      }),
      req.file.originalname || 'formula.png'
    );

    const upstream = await fetch(serviceUrl, {
      method: 'POST',
      body: form
    });

    const payload = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      return res.status(502).json({
        error: payload.error ||
          `Pix2Text service returned HTTP ${upstream.status}.`
      });
    }

    const recognized = payload.latex ?? payload.text ?? payload.result;

    if (recognized === undefined || recognized === null) {
      return res.status(502).json({
        error: 'Pix2Text service response did not contain a latex or text field.'
      });
    }

    return res.json({
      success: true,
      latex: typeof recognized === 'string'
        ? recognized
        : JSON.stringify(recognized)
    });
  } catch (error) {
    console.error('Pix2Text request failed:', error?.message || 'unknown error');
    return res.status(503).json({
      error: 'Could not reach Pix2Text. Check that its Python service is running.'
    });
  }
});

app.post('/api/delete-account', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : '';

  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!token) {
    return res.status(401).json({
      error: 'Please sign in again before deleting your account.'
    });
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(503).json({
      error: 'Account deletion is not configured on the server.'
    });
  }

  try {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data, error: authError } = await admin.auth.getUser(token);

    if (authError || !data.user?.id) {
      return res.status(401).json({
        error: 'Your session is invalid or expired. Please sign in again.'
      });
    }

    const { error } = await admin.auth.admin.deleteUser(data.user.id);

    if (error) {
      console.error('Account deletion failed:', error.message);
      return res.status(500).json({
        error: 'The account could not be deleted. Please try again later.'
      });
    }

    return res.json({
      success: true,
      message: 'Your account has been permanently deleted.'
    });
  } catch (error) {
    console.error('Account deletion request failed:', error?.message || 'unknown error');
    return res.status(500).json({
      error: 'Account deletion failed. Please try again later.'
    });
  }
});

app.use(express.static(distPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found.' });
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
