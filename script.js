// VibeMatch — Frontend
// API URL: localhost uses /api/search, GitHub Pages uses Vercel backend
const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? ""
  : ""; // Same origin — frontend and API are both on Vercel now

const form = document.getElementById("searchForm");
const input = document.getElementById("searchInput");
const btn = document.getElementById("searchBtn");
const results = document.getElementById("results");
const emptyState = document.getElementById("emptyState");
const reasoning = document.getElementById("reasoning");
const reasoningContent = document.getElementById("reasoningContent");

const sections = [
  { id: "mcp", key: "mcps", cards: "mcpCards", section: "mcpSection", count: "mcpCount", reason: "mcpReason" },
  { id: "skill", key: "skills", cards: "skillCards", section: "skillSection", count: "skillCount", reason: "skillReason" },
  { id: "agent", key: "agents", cards: "agentCards", section: "agentSection", count: "agentCount", reason: "agentReason" },
];

function createCard(item, type) {
  const stars = item.stars >= 1000 ? `${(item.stars / 1000).toFixed(1)}k` : item.stars;
  return `
    <div class="card">
      <div class="card-header">
        <span class="card-name">${escapeHtml(item.full_name)}</span>
        <span class="card-stars">⭐ ${stars}</span>
      </div>
      <p class="card-desc">${escapeHtml(item.description || "No description")}</p>
      <div class="card-footer">
        <span class="type-badge ${type}">${type.toUpperCase()}</span>
        <a href="${item.url}" target="_blank" rel="noopener" class="card-link">View on GitHub →</a>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function setLoading(loading) {
  btn.querySelector(".btn-text").hidden = loading;
  btn.querySelector(".btn-loading").hidden = !loading;
  btn.disabled = loading;
  input.disabled = loading;
}

function showResults(data) {
  results.hidden = false;

  // Show reasoning
  if (data.analysis && data.analysis.reasoning) {
    reasoning.hidden = false;
    const r = data.analysis.reasoning;
    reasoningContent.innerHTML = `
      <p><strong>🔌 MCPs:</strong> ${escapeHtml(r.mcp || "—")}</p>
      <p><strong>🛠 Skills:</strong> ${escapeHtml(r.skill || "—")}</p>
      <p><strong>🤖 Agents:</strong> ${escapeHtml(r.agent || "—")}</p>
    `;
  }

  let totalResults = 0;

  // Show each section
  for (const s of sections) {
    const items = data.results[s.key] || [];
    const section = document.getElementById(s.section);
    const cards = document.getElementById(s.cards);
    const count = document.getElementById(s.count);
    const reason = document.getElementById(s.reason);

    if (items.length > 0) {
      section.hidden = false;
      count.textContent = `(${items.length})`;
      cards.innerHTML = items.map((item) => createCard(item, s.id)).join("");
      // Show relevant reasoning for this section
      if (data.analysis && data.analysis.reasoning[s.id]) {
        reason.textContent = data.analysis.reasoning[s.id];
      }
      totalResults += items.length;
    } else {
      section.hidden = true;
    }
  }

  // Empty state
  emptyState.hidden = totalResults > 0;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const query = input.value.trim();
  if (!query) return;

  setLoading(true);
  results.hidden = true;
  emptyState.hidden = true;
  reasoning.hidden = true;

  try {
    const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    const data = await res.json();
    showResults(data);
  } catch (err) {
    results.hidden = false;
    emptyState.hidden = false;
    emptyState.innerHTML = `<p>❌ ${escapeHtml(err.message)}</p>`;
  } finally {
    setLoading(false);
  }
});
