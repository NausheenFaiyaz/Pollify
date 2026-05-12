import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../api/client";

const socket = io(import.meta.env.VITE_SOCKET_URL as string, { autoConnect: false });
const resultPalette = ["var(--pink)", "var(--mint)", "var(--sky)"];

export default function PollAnalyticsPage() {
  const { slug = "" } = useParams();
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    void api.get(`/polls/${slug}/analytics`).then((res) => setAnalytics(res.data.data.analytics));

    socket.connect();
    socket.emit("poll:join", slug);
    socket.on("analytics:update", (payload) => setAnalytics(payload));

    return () => {
      socket.emit("poll:leave", slug);
      socket.off("analytics:update");
      socket.disconnect();
    };
  }, [slug]);

  const publish = async () => {
    try {
      await api.patch(`/polls/${slug}/publish`);
      toast.success("Poll published successfully");
    } catch {
      toast.error("Could not publish poll");
    }
  };

  if (!analytics) return <p>Loading analytics...</p>;

  return (
    <section className="stack">
      <div className="pageHead">
        <div>
          <h2>{analytics.poll.title}</h2>
          <p className="muted">Realtime summary for your poll mission.</p>
        </div>
        <button className="btn" onClick={publish}>Publish Results</button>
      </div>

      <div className="grid stats3">
        <article className="card statCard"><p>Total</p><h3>{analytics.participation.totalResponses}</h3></article>
        <article className="card statCard"><p>Anonymous</p><h3>{analytics.participation.anonymousResponses}</h3></article>
        <article className="card statCard"><p>Authenticated</p><h3>{analytics.participation.authenticatedResponses}</h3></article>
      </div>

      {analytics.questionSummary.map((q: any, qIndex: number) => {
        const total = q.options.reduce((sum: number, o: any) => sum + o.count, 0) || 1;
        return (
          <article className="pollSection" key={q.questionId}>
            <h3>Q{qIndex + 1}. {q.prompt}</h3>
            {q.options.map((o: any, idx: number) => (
              <div className="resultRow" key={o.label}>
                <div className="resultLabel resultLabelWithBadge">
                  <span className="optionBadge">{String.fromCharCode(65 + idx)}</span>
                  <span>{o.label}</span>
                </div>
                <div className="resultBarWrap">
                  <div
                    className="resultBar"
                    style={{
                      width: `${Math.round((o.count / total) * 100)}%`,
                      background: resultPalette[idx % resultPalette.length],
                    }}
                  />
                </div>
                <div className="resultMeta">{o.count} ({Math.round((o.count / total) * 100)}%)</div>
              </div>
            ))}
          </article>
        );
      })}
    </section>
  );
}
