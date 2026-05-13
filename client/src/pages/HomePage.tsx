import { Link } from "react-router-dom";
import { startOidcLogin } from "../auth/oidc";
import { useAuthToken } from "../auth/useAuthToken";

export default function HomePage() {
  const token = useAuthToken();

  return (
    <section className="stack landingPage">
      <div className="hero landingHero">
        <div className="heroGrid">
          <div>
            <p className="kicker">Realtime Poll Mission Control</p>
            <h1 className="mega">Ask Smart. Collect Fast. Publish When Ready.</h1>
            <p className="lead">
              Pollify helps teams, creators, and communities launch clean polls, gather real responses, and turn
              choices into clear insights.
            </p>
            <p className="muted landingIntro">
              Run anonymous or authenticated polls, set expiries, prevent duplicate submissions, and track option-level
              trends in realtime from one dashboard.
            </p>
            <div className="actions">
              {token ? (
                <Link className="btn" to="/dashboard">Open Dashboard</Link>
              ) : (
                <button className="btn" onClick={() => void startOidcLogin()}>Continue with TokenShinobi</button>
              )}
              <Link className="btn btn-outline" to="/poll/create">Create First Poll</Link>
            </div>
          </div>
          <div className="featureColumn">
            <article className="featureCard pink">
              <h3>1 Link, Many Respondents</h3>
              <p>Share once and collect from classmates, teammates, followers, or event attendees instantly.</p>
            </article>
            <article className="featureCard mint">
              <h3>Controlled Visibility</h3>
              <p>Keep analytics private while polling, then publish results when your timing is right.</p>
            </article>
            <article className="featureCard sky">
              <h3>Question-Level Insights</h3>
              <p>Track distribution and participation per question with simple, visual progress analytics.</p>
            </article>
          </div>
        </div>
      </div>

      <section className="pollSection landingSection">
        <div className="sectionHeadRow">
          <h3>Built For Real Feedback</h3>
        </div>
        <p className="muted">
          Everything you need to ask, collect, validate, and act on responses without messy setup.
        </p>
        <div className="grid landingFeatureGrid">
          <article className="card">
            <h4>Anonymous or Authenticated</h4>
            <p className="muted">Allow open responses, verified responses, or both based on your poll objective.</p>
          </article>
          <article className="card">
            <h4>Realtime Analytics Dashboard</h4>
            <p className="muted">Watch responses update live with clear per-option counts and percentages.</p>
          </article>
          <article className="card">
            <h4>Multi-Question Polls</h4>
            <p className="muted">Ask one question or run a full flow with multiple questions and required checks.</p>
          </article>
          <article className="card">
            <h4>Expiry and Publish Controls</h4>
            <p className="muted">Auto-close responses by date and only reveal outcomes when you decide.</p>
          </article>
          <article className="card">
            <h4>Session-Aware Submissions</h4>
            <p className="muted">Responses are persisted per user/session so submitted choices remain consistent.</p>
          </article>
          <article className="card">
            <h4>Share Anywhere</h4>
            <p className="muted">Use one public link in chats, communities, classrooms, or social posts.</p>
          </article>
        </div>
      </section>

      <section className="pollSection landingSection">
        <h3>How Pollify Works</h3>
        <div className="grid landingFlow">
          <article className="card featureCard sky">
            <p className="kicker">Step 1</p>
            <h4>Create</h4>
            <p>Write your title, add options, mark required questions, and set response mode + expiry.</p>
          </article>
          <article className="card featureCard mint">
            <p className="kicker">Step 2</p>
            <h4>Collect</h4>
            <p>Share your poll link. Participants answer question-by-question with a clean mobile-friendly UI.</p>
          </article>
          <article className="card featureCard pink">
            <p className="kicker">Step 3</p>
            <h4>Analyze & Publish</h4>
            <p>Monitor live analytics privately and publish polished result views when polling is complete.</p>
          </article>
        </div>
      </section>

      <section className="pollSection landingCta">
        <div>
          <p className="kicker">Get Started</p>
          <h3>Ready To Launch Your Next Poll?</h3>
          <p className="muted">Create in under a minute and start collecting insights immediately.</p>
        </div>
        <div className="actions">
          <Link className="btn" to="/poll/create">Create Poll</Link>
          {!token ? <button className="btn btn-outline" onClick={() => void startOidcLogin()}>Sign In</button> : null}
        </div>
      </section>
    </section>
  );
}
