import { useRef, useState } from 'react';
import { apiUpload } from '../lib/api.js';
import Avatar from './Avatar.jsx';
import './AvatarUpload.css';

function CameraIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

export default function AvatarUpload({ url, name, onUploaded, onError }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-uploading the same filename
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      onError?.('Image must be under 2 MB');
      return;
    }
    setBusy(true);
    try {
      const res = await apiUpload('/api/profile/avatar', (() => {
        const fd = new FormData();
        fd.append('avatar', file);
        return fd;
      })());
      onUploaded?.(res.avatar_url);
    } catch (err) {
      onError?.(err.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="avatar-upload">
      <button
        type="button"
        className="avatar-upload__btn"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        aria-label="Change avatar"
      >
        <Avatar url={url} name={name} size={96} />
        <span className="avatar-upload__overlay" aria-hidden="true">
          <CameraIcon />
        </span>
        {busy && <span className="avatar-upload__spinner" aria-hidden="true" />}
      </button>
      <input
        ref={inputRef}
        className="avatar-upload__input"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={onFile}
      />
    </div>
  );
}
