import { Router } from 'express';
import multer from 'multer';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError, isTheme } from '../lib/validate.js';
import logger from '../logger.js';

const router = Router();
router.use(requireAuth);

// 2 MB cap for avatars.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

const ALLOWED_MIME = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, avatar_url, timezone, theme, created_at, updated_at')
      .eq('id', req.user.id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.put('/', async (req, res, next) => {
  try {
    const { display_name, timezone, theme } = req.body ?? {};
    const patch = {};
    if (display_name !== undefined) {
      if (typeof display_name !== 'string' || display_name.length > 80) {
        throw new HttpError(400, 'display_name invalid');
      }
      patch.display_name = display_name.trim();
    }
    if (timezone !== undefined) {
      if (typeof timezone !== 'string' || timezone.length > 64) {
        throw new HttpError(400, 'timezone invalid');
      }
      patch.timezone = timezone;
    }
    if (theme !== undefined) {
      if (!isTheme(theme)) throw new HttpError(400, 'theme invalid');
      patch.theme = theme;
    }
    if (Object.keys(patch).length === 0) {
      throw new HttpError(400, 'nothing to update');
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(patch)
      .eq('id', req.user.id)
      .select('id, display_name, avatar_url, timezone, theme, updated_at')
      .single();
    if (error) throw error;

    logger.info('profile updated', { user_id: req.user.id, fields: Object.keys(patch) });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post('/avatar', upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) throw new HttpError(400, 'avatar file is required');
    const ext = ALLOWED_MIME[req.file.mimetype];
    if (!ext) throw new HttpError(400, 'unsupported image type');

    // Stable filename per user — overwrite on each upload so we don't
    // accumulate orphaned objects.
    const path = `${req.user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(path, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });
    if (uploadError) throw uploadError;

    const { data: pub } = supabaseAdmin.storage.from('avatars').getPublicUrl(path);
    // Cache-bust so the <img> updates immediately after re-upload.
    const avatar_url = `${pub.publicUrl}?v=${Date.now()}`;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ avatar_url })
      .eq('id', req.user.id)
      .select('avatar_url')
      .single();
    if (error) throw error;

    logger.info('avatar uploaded', { user_id: req.user.id, bytes: req.file.size });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
