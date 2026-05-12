import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../api/client";

const socket = io(import.meta.env.VITE_SOCKET_URL as string, { autoConnect: false });

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
    await api.patch(`/polls/${slug}/publish`);
    alert("Published successfully");
  };

  if (!analytics) return <p>Loading analytics...</p>;

  return (
    <section className="stack">
      <h2>{analytics.poll.title}</h2>
      <p>Total Responses: {analytics.participation.totalResponses}</p>
      <button onClick={publish}>Publish Results</button>
      {analytics.questionSummary.map((q: any) => (
        <article className="card" key={q.questionId}>
          <h4>{q.prompt}</h4>
          {q.options.map((o: any) => (
            <p key={o.label}>{o.label}: {o.count}</p>
          ))}
        </article>
      ))}
    </section>
  );
}
