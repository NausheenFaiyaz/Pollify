import { startOidcLogin } from "../auth/oidc";

export default function HomePage() {
  return (
    <section className="hero">
      <h1>PulseBoard: Live Polls For Feedback</h1>
      <p>Create polls, collect feedback, publish outcomes, and watch analytics update live.</p>
      <button onClick={startOidcLogin}>Get Started With OIDC Login</button>
    </section>
  );
}
