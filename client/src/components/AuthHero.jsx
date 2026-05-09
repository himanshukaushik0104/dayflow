// Decorative left-hand panel on the auth split-card. Shown on
// desktop only; CSS hides it under 769 px.
export default function AuthHero({
  title = 'Find your rhythm.',
  body = 'A minimalist sanctuary for your daily habits and focus. Join 50,000+ users flowing through their day with intention.',
}) {
  return (
    <div className="auth-hero">
      <span className="auth-hero__shape-2" aria-hidden="true" />
      <span className="auth-hero__shape-1" aria-hidden="true" />
      <h2 className="auth-hero__title">{title}</h2>
      <p className="auth-hero__body">{body}</p>
    </div>
  );
}
