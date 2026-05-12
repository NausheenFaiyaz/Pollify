import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/client";
import type { Poll } from "../types/poll";

export default function PublicPollPage() {
  const { slug = "" } = useParams();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  useEffect(() => {
    void api.get(`/polls/public/${slug}`).then((res) => setPoll(res.data.data.poll));
  }, [slug]);

  const sessionId = useMemo(() => {
    const existing = localStorage.getItem("ps_anon_sid");
    if (existing) return existing;
    const next = crypto.randomUUID();
    localStorage.setItem("ps_anon_sid", next);
    return next;
  }, []);

  const submit = async () => {
    if (!poll) return;
    await api.post(`/polls/public/${poll.slug}/respond`, {
      anonymousSessionId: sessionId,
      answers: Object.entries(answers).map(([questionId, optionIndex]) => ({ questionId, optionIndex })),
    });
    alert("Response submitted");
  };

  if (!poll) return <p>Loading poll...</p>;

  return (
    <section className="stack">
      <h2>{poll.title}</h2>
      <p>{poll.description}</p>
      {poll.questions.map((q) => (
        <article key={q._id} className="card">
          <h4>{q.prompt}</h4>
          {q.options.map((o, index) => (
            <label key={o.label}>
              <input
                type="radio"
                name={q._id}
                onChange={() => setAnswers((prev) => ({ ...prev, [q._id]: index }))}
              />
              {o.label}
            </label>
          ))}
        </article>
      ))}
      <button onClick={submit}>Submit</button>
    </section>
  );
}
