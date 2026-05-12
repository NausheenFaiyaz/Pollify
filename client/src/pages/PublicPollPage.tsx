import { AxiosError } from "axios";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import api from "../api/client";
import { getToken, startOidcLogin } from "../auth/oidc";
import AuthRequiredPanel from "../components/public-poll/AuthRequiredPanel";
import PollStatusPanel from "../components/public-poll/PollStatusPanel";
import { getSubmissionToken } from "../lib/submissionToken";
import type { Poll } from "../types/poll";

type Analytics = {
  participation: { totalResponses: number; anonymousResponses: number; authenticatedResponses: number };
  questionSummary: Array<{ questionId: string; prompt: string; options: Array<{ label: string; count: number }> }>;
};
const resultPalette = ["var(--pink)", "var(--mint)", "var(--sky)"];

type PublicPollPayload = {
  poll: Poll;
  isExpired: boolean;
  showResults?: boolean;
  analytics?: Analytics;
  existingResponse?: {
    answers: Array<{ questionId: string; optionIndex: number }>;
  } | null;
};

const getApiError = (err: unknown) => {
  if (err instanceof AxiosError) {
    return (err.response?.data as { message?: string })?.message ?? err.message;
  }
  return "Something went wrong";
};

export default function PublicPollPage() {
  const { slug = "" } = useParams();
  const [payload, setPayload] = useState<PublicPollPayload | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const sessionId = useMemo(() => (slug ? getSubmissionToken(slug) : ""), [slug]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/polls/public/${slug}`, { params: { sessionId } });
        const nextPayload = res.data.data as PublicPollPayload;
        setPayload(nextPayload);
        if (nextPayload.existingResponse?.answers?.length) {
          const restored = Object.fromEntries(
            nextPayload.existingResponse.answers.map((a) => [a.questionId, a.optionIndex])
          ) as Record<string, number>;
          setAnswers(restored);
          setAlreadySubmitted(true);
        }
      } catch (err) {
        toast.error(getApiError(err));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [sessionId, slug]);

  const validateRequiredAnswers = () => {
    if (!payload?.poll) return "";
    for (const q of payload.poll.questions) {
      if (q.required && answers[q._id] === undefined) {
        return `Please answer required question: ${q.prompt}`;
      }
    }
    return "";
  };

  const submit = async () => {
    if (!payload?.poll) return;

    const validationError = validateRequiredAnswers();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setSubmitting(true);

      await api.post(`/polls/public/${payload.poll.slug}/respond`, {
        anonymousSessionId: sessionId,
        answers: Object.entries(answers).map(([questionId, optionIndex]) => ({ questionId, optionIndex })),
      });

      setAlreadySubmitted(true);
      toast.success("Response submitted successfully.");
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading poll...</p>;
  if (!payload?.poll) return <p>Poll unavailable.</p>;

  const { poll, isExpired, analytics, showResults } = payload;
  const needsAuth = poll.responseMode === "authenticated" && !getToken();
  const activeQuestion = poll.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === poll.questions.length - 1;
  const canGoNext = activeQuestion ? answers[activeQuestion._id] !== undefined || !activeQuestion.required : false;
  const canSubmit = alreadySubmitted || !validateRequiredAnswers();

  return (
    <section className="stack createPollPage">
      <h2>{poll.title}</h2>
      <p className="muted">{poll.description || "No description"}</p>

      <PollStatusPanel poll={poll} isExpired={isExpired} />
      {needsAuth ? <AuthRequiredPanel onLogin={() => void startOidcLogin(window.location.pathname + window.location.search)} /> : null}

      {showResults && analytics ? (
        <section className="pollSection">
          <h3>Final Results</h3>
          <p className="muted">Total responses: {analytics.participation.totalResponses}</p>
          {analytics.questionSummary.map((q, qIndex) => {
            const total = q.options.reduce((sum, opt) => sum + opt.count, 0) || 1;
            return (
              <article key={q.questionId} className="pollSection">
                <h4>Q{qIndex + 1}. {q.prompt}</h4>
                {q.options.map((opt, idx) => (
                  <div className="resultRow" key={opt.label}>
                    <div className="resultLabel resultLabelWithBadge">
                      <span className="optionBadge">{String.fromCharCode(65 + idx)}</span>
                      <span>{opt.label}</span>
                    </div>
                    <div className="resultBarWrap">
                      <div
                        className="resultBar"
                        style={{
                          width: `${Math.round((opt.count / total) * 100)}%`,
                          background: resultPalette[idx % resultPalette.length],
                        }}
                      />
                    </div>
                    <div className="resultMeta">{opt.count} ({Math.round((opt.count / total) * 100)}%)</div>
                  </div>
                ))}
              </article>
            );
          })}
        </section>
      ) : null}

      {!needsAuth && !isExpired && !showResults && activeQuestion ? (
        <article key={activeQuestion._id} className="card quizCard">
          <h4>
            Q{currentQuestionIndex + 1}. {activeQuestion.prompt} {activeQuestion.required ? "*" : "(Optional)"}
          </h4>
          <div className="quizOptions">
          {activeQuestion.options.map((o, index) => (
            <label key={`${activeQuestion._id}-${index}`} className={`optionRow quizOption ${answers[activeQuestion._id] === index ? "selected" : ""}`}>
              <span className="optionBadge">{String.fromCharCode(65 + index)}</span>
              <input
                type="radio"
                name={activeQuestion._id}
                checked={answers[activeQuestion._id] === index}
                disabled={alreadySubmitted}
                onChange={() => setAnswers((prev) => ({ ...prev, [activeQuestion._id]: index }))}
              />
              <span>{o.label}</span>
            </label>
          ))}
          </div>
          <div className="actions">
            <button type="button" className="ghost" disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}>
              Back
            </button>
            {!isLastQuestion ? (
              <button
                type="button"
                className="btn"
                disabled={!canGoNext || alreadySubmitted}
                onClick={() => setCurrentQuestionIndex((prev) => Math.min(poll.questions.length - 1, prev + 1))}
              >
                Next
              </button>
            ) : (
              <button type="button" disabled={submitting || !canSubmit || alreadySubmitted} onClick={submit}>
                {submitting ? "Submitting..." : alreadySubmitted ? "Submitted" : "Submit Response"}
              </button>
            )}
          </div>
        </article>
      ) : null}
    </section>
  );
}
