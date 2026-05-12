import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import type { Poll } from "../types/poll";

export default function DashboardPage() {
  const [polls, setPolls] = useState<Poll[]>([]);

  useEffect(() => {
    void api.get("/polls/mine").then((res) => setPolls(res.data.data.polls));
  }, []);

  return (
    <section>
      <h2>Your Polls</h2>
      <div className="grid">
        {polls.map((p) => (
          <article key={p._id} className="card">
            <h3>{p.title}</h3>
            <p>/poll/{p.slug}</p>
            <p>{new Date(p.expiresAt).toLocaleString()}</p>
            <Link to={`/poll/${p.slug}/analytics`}>View Analytics</Link>
            <Link to={`/poll/${p.slug}`}>Open Public Link</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
