import { useEffect, useMemo, useState } from "react";
import { FaChartLine, FaClock, FaFilter, FaPlus, FaSortAmountDown } from "react-icons/fa";
import { Link } from "react-router-dom";
import api from "../api/client";
import CopyLinkButton from "../components/ui/CopyLinkButton";
import type { Poll } from "../types/poll";

type TabKey = "all" | "live" | "expired" | "published";
type SortKey = "newest" | "oldest" | "expiring_soon";

const isExpired = (poll: Poll) => new Date(poll.expiresAt).getTime() < Date.now();

const truncateWords = (value: string, maxWords: number) => {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return value;
  return `${words.slice(0, maxWords).join(" ")}...`;
};

export default function DashboardPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [tab, setTab] = useState<TabKey>("all");
  const [sort, setSort] = useState<SortKey>("newest");

  useEffect(() => {
    void api.get("/polls/mine").then((res) => setPolls(res.data.data.polls));
  }, []);

  const counts = useMemo(() => ({
    all: polls.length,
    live: polls.filter((p) => !isExpired(p)).length,
    expired: polls.filter((p) => isExpired(p)).length,
    published: polls.filter((p) => p.isPublished).length,
  }), [polls]);

  const filtered = useMemo(() => {
    let list = [...polls];

    if (tab === "live") list = list.filter((p) => !isExpired(p));
    if (tab === "expired") list = list.filter((p) => isExpired(p));
    if (tab === "published") list = list.filter((p) => p.isPublished);

    if (sort === "newest") list.sort((a, b) => new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime());
    if (sort === "oldest") list.sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
    if (sort === "expiring_soon") list.sort((a, b) => Math.abs(new Date(a.expiresAt).getTime() - Date.now()) - Math.abs(new Date(b.expiresAt).getTime() - Date.now()));

    return list;
  }, [polls, tab, sort]);

  return (
    <section className="stack">
      <div className="pageHead">
        <div>
          <h2>Mission Control</h2>
          <p className="muted">Manage your polls, links, expiry, and public outcomes.</p>
        </div>
        <Link className="btn" to="/poll/create"><FaPlus /> New Poll</Link>
      </div>

      <div className="dashboardTools pollSection">
        <div className="tabRow">
          <button type="button" className={`tabBtn ${tab === "all" ? "active" : ""}`} onClick={() => setTab("all")}>Total ({counts.all})</button>
          <button type="button" className={`tabBtn ${tab === "live" ? "active" : ""}`} onClick={() => setTab("live")}>Live ({counts.live})</button>
          <button type="button" className={`tabBtn ${tab === "expired" ? "active" : ""}`} onClick={() => setTab("expired")}>Expired ({counts.expired})</button>
          <button type="button" className={`tabBtn ${tab === "published" ? "active" : ""}`} onClick={() => setTab("published")}>Published ({counts.published})</button>
        </div>
        <label className="sortSelect">
          <FaSortAmountDown />
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="expiring_soon">Expiring Soon</option>
          </select>
        </label>
      </div>

      {filtered.length === 0 && <div className="pollSection"><p>No polls for this filter yet.</p></div>}

      <div className="grid">
        {filtered.map((p) => (
          <article key={p._id} className="card pollCard">
            <p className="kicker">/{p.slug}</p>
            <h3 title={p.title}>{truncateWords(p.title, 5)}</h3>
            <p className="muted" title={p.description || "No description"}>{truncateWords(p.description || "No description", 10)}</p>
            <div className="pillRow">
              <span className="pill"><FaFilter /> {p.responseMode}</span>
              <span className="pill"><FaClock /> {isExpired(p) ? "Expired" : "Live"}</span>
              <span className="pill"><FaChartLine /> {p.isPublished ? "Published" : "Draft"}</span>
            </div>
            <p className="muted">Expires: {new Date(p.expiresAt).toLocaleString()}</p>
            <div className="actions">
              <CopyLinkButton slug={p.slug} />
              <Link className="btn btn-outline" to={`/poll/${p.slug}`}>Open Poll</Link>
              <Link className="btn" to={`/poll/${p.slug}/analytics`}>Analytics</Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
