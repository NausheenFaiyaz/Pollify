import type { Poll } from "../../types/poll";

export default function PollStatusPanel({ poll, isExpired }: { poll: Poll; isExpired: boolean }) {
  const status = isExpired ? "Expired" : poll.isPublished ? "Published" : "Accepting responses";

  return (
    <section className="pollSection">
      <h3>Poll Status</h3>
      <p className="muted">{status}</p>
      <div className="statusGrid">
        <div>
          <p className="muted">Mode</p>
          <strong>{poll.responseMode}</strong>
        </div>
        <div>
          <p className="muted">Expires</p>
          <strong>{new Date(poll.expiresAt).toLocaleString()}</strong>
        </div>
      </div>
    </section>
  );
}
