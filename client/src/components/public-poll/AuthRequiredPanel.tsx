export default function AuthRequiredPanel({ onLogin }: { onLogin: () => void }) {
  return (
    <section className="pollSection">
      <h3>Login Required</h3>
      <p className="muted">This poll accepts authenticated responses only. Please sign in to continue.</p>
      <button type="button" onClick={onLogin}>Login to Respond</button>
    </section>
  );
}
