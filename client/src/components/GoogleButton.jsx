// Standalone so Login + Signup can both reuse it. Uses the auth-google
// styles defined in pages/Auth.css.
export default function GoogleButton({ onClick, disabled, label = 'Sign in with Google' }) {
  return (
    <button type="button" className="auth-google" onClick={onClick} disabled={disabled}>
      <svg className="auth-google__glyph" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M12 5.04c1.94 0 3.68.67 5.05 1.97l3.77-3.77C18.46 1.18 15.46 0 12 0 7.31 0 3.25 2.69 1.25 6.63l4.22 3.27C6.47 7.02 9.01 5.04 12 5.04z" fill="#EA4335"/>
        <path d="M23.49 12.27c0-.8-.07-1.56-.19-2.3H12v4.34h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.68 2.85c2.15-1.98 3.39-4.89 3.39-8.44z" fill="#4285F4"/>
        <path d="M5.47 14.1c-.24-.7-.37-1.44-.37-2.1s.13-1.4.37-2.1L1.25 6.63C.45 8.23 0 10.06 0 12s.45 3.77 1.25 5.37l4.22-3.27z" fill="#FBBC05"/>
        <path d="M12 24c3.24 0 5.95-1.07 7.94-2.91l-3.68-2.85c-1.1.74-2.5 1.18-4.26 1.18-3.25 0-6.02-2.19-7-5.13l-4.22 3.27C3.25 21.31 7.31 24 12 24z" fill="#34A853"/>
      </svg>
      <span>{label}</span>
    </button>
  );
}
