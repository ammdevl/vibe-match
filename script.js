// VibeMatch — Frontend

// --- Theme Toggle ---
(function () {
  const root = document.documentElement;
  const toggle = document.getElementById("themeToggle");
  if (!toggle) return;

  const saved = localStorage.getItem("vibe-theme");
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;

  // Apply initial theme
  if (saved === "light" || (!saved && prefersLight)) {
    root.setAttribute("data-theme", "light");
  } else {
    root.removeAttribute("data-theme");
  }

  toggle.addEventListener("click", () => {
    const isLight = root.getAttribute("data-theme") === "light";
    if (isLight) {
      root.removeAttribute("data-theme");
      localStorage.setItem("vibe-theme", "dark");
    } else {
      root.setAttribute("data-theme", "light");
      localStorage.setItem("vibe-theme", "light");
    }
  });
})();

const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? ""
  : "";

// DOM Elements
const form = document.getElementById("searchForm");
const input = document.getElementById("searchInput");
const btn = document.getElementById("searchBtn");
const clearBtn = document.getElementById("searchClear");
const results = document.getElementById("results");
const emptyState = document.getElementById("emptyState");
const errorState = document.getElementById("errorState");
const errorMsg = document.getElementById("errorMsg");
const errorRetryBtn = document.getElementById("errorRetryBtn");
const reasoning = document.getElementById("reasoning");
const reasoningContent = document.getElementById("reasoningContent");
const cardsGrid = document.getElementById("cardsGrid");
const resultTabs = document.getElementById("resultTabs");
const skeleton = document.getElementById("skeletonLoading");
const scrollTopBtn = document.getElementById("scrollTop");

// Tab buttons
const tabAll = document.querySelector('[data-tab="all"]');
const tabMcp = document.querySelector('[data-tab="mcp"]');
const tabSkill = document.querySelector('[data-tab="skill"]');
const tabAgent = document.querySelector('[data-tab="agent"]');
const tabCountAll = document.getElementById("tabCountAll");
const tabCountMcp = document.getElementById("tabCountMcp");
const tabCountSkill = document.getElementById("tabCountSkill");
const tabCountAgent = document.getElementById("tabCountAgent");

let allCards = [];
let activeTab = "all";
let lastQuery = "";

// --- Helpers ---
function formatStars(n) {
  if (n === null || n === undefined) return "—";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(2)}k`;
  return n.toString();
}

function formatDownloads(n) {
  if (n === null || n === undefined) return null;
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

// Block dangerous URL protocols to prevent XSS
function sanitizeUrl(url) {
  if (!url) return "";
  const trimmed = url.trim().toLowerCase();
  if (trimmed.startsWith("javascript:") || trimmed.startsWith("data:") || trimmed.startsWith("vbscript:")) {
    return "";
  }
  return url;
}

function createCard(item, type) {
  const stars = formatStars(item.stars);
  const dl = formatDownloads(item.weeklyDownloads || item.downloads);
  const safeUrl = sanitizeUrl(item.url);
  const linkText = safeUrl.includes("npmjs.com") ? "npm" : "GitHub";
  const linkIcon = safeUrl.includes("npmjs.com")
    ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>'
    : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';

  const dlHtml = dl
    ? `<span class="card-downloads" title="Weekly downloads">⬇ ${dl}</span>`
    : "";

  const urlHtml = safeUrl
    ? `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer" class="card-link">${linkText} ${linkIcon}</a>`
    : "";

  return `
    <div class="card" data-type="${type}" style="animation-delay: var(--card-delay, 0s)">
      <div class="card-header">
        <span class="card-name">${escapeHtml(item.full_name || "")}</span>
        <div class="card-stats">
          ${dlHtml}
          <span class="card-stars">⭐ ${stars}</span>
        </div>
      </div>
      <p class="card-desc">${escapeHtml(item.description || "No description")}</p>
      <div class="card-footer">
        <span class="type-badge ${type}">${type.toUpperCase()}</span>
        ${urlHtml}
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// --- Loading State ---
function setLoading(loading) {
  btn.querySelector(".btn-text").hidden = loading;
  btn.querySelector(".btn-loading").hidden = !loading;
  btn.disabled = loading;
  input.disabled = loading;

  if (loading) {
    skeleton.hidden = false;
    results.hidden = true;
    emptyState.hidden = true;
    errorState.hidden = true;
    document.querySelector(".search-box")?.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    skeleton.hidden = true;
  }
}

// --- Clear Button ---
function updateClearButton() {
  clearBtn.hidden = input.value.trim() === "";
}

input.addEventListener("input", updateClearButton);
clearBtn.addEventListener("click", () => {
  input.value = "";
  updateClearButton();
  input.focus();
});

// --- Tab Switching ---
function switchTab(tab) {
  activeTab = tab;
  [tabAll, tabMcp, tabSkill, tabAgent].forEach(t => {
    t.classList.remove("active");
    t.setAttribute("aria-pressed", "false");
  });

  const activeBtn = document.querySelector(`[data-tab="${tab}"]`);
  if (activeBtn) {
    activeBtn.classList.add("active");
    activeBtn.setAttribute("aria-pressed", "true");
  }

  renderCards();
}

tabAll.addEventListener("click", () => switchTab("all"));
tabMcp.addEventListener("click", () => switchTab("mcp"));
tabSkill.addEventListener("click", () => switchTab("skill"));
tabAgent.addEventListener("click", () => switchTab("agent"));

function renderCards() {
  const filtered = activeTab === "all"
    ? allCards
    : allCards.filter(c => c.type === activeTab);

  if (filtered.length === 0) {
    cardsGrid.innerHTML = "";
    emptyState.hidden = false;
    emptyState.querySelector(".empty-state-title").textContent =
      activeTab === "all" ? "No matches found" : `No ${activeTab}s found`;
    emptyState.querySelector(".empty-state-hint").textContent =
      activeTab === "all"
        ? "Try different or broader keywords to discover more tools."
        : `Try the "All" tab or search with different keywords.`;
  } else {
    emptyState.hidden = true;
    cardsGrid.innerHTML = filtered.map((item, i) => {
      const html = createCard(item.item, item.type);
      // Inject staggered delay
      return html.replace("var(--card-delay, 0s)", `${i * 0.06}s`);
    }).join("");
  }
}

// --- Scroll to Top ---
function updateScrollTopVisibility() {
  scrollTopBtn.hidden = window.scrollY < 400;
}

window.addEventListener("scroll", updateScrollTopVisibility, { passive: true });

scrollTopBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// --- Show Results ---
function showResults(data) {
  results.hidden = false;
  emptyState.hidden = true;
  errorState.hidden = true;

  // Show reasoning
  if (data.analysis && data.analysis.reasoning) {
    reasoning.hidden = false;
    const r = data.analysis.reasoning;
    reasoningContent.innerHTML = `
      <p><strong>🔌 MCPs:</strong> ${escapeHtml(r.mcp || "—")}</p>
      <p><strong>🛠 Skills:</strong> ${escapeHtml(r.skill || "—")}</p>
      <p><strong>🤖 Agents:</strong> ${escapeHtml(r.agent || "—")}</p>
    `;
  } else {
    reasoning.hidden = true;
  }

  // Build all cards
  allCards = [];
  const sections = [
    { key: "mcps", type: "mcp" },
    { key: "skills", type: "skill" },
    { key: "agents", type: "agent" },
  ];

  let totalMcp = 0, totalSkill = 0, totalAgent = 0;

  for (const s of sections) {
    const items = data.results[s.key] || [];
    if (s.type === "mcp") totalMcp = items.length;
    if (s.type === "skill") totalSkill = items.length;
    if (s.type === "agent") totalAgent = items.length;

    for (const item of items) {
      allCards.push({ item, type: s.type });
    }
  }

  const total = allCards.length;

  // Update tab counts
  tabCountAll.textContent = total;
  tabCountMcp.textContent = totalMcp;
  tabCountSkill.textContent = totalSkill;
  tabCountAgent.textContent = totalAgent;

  // Show/hide tabs
  resultTabs.hidden = total === 0;

  // Reset to "all" tab and render
  activeTab = "all";
  [tabAll, tabMcp, tabSkill, tabAgent].forEach(t => {
    t.classList.remove("active");
    t.setAttribute("aria-pressed", "false");
  });
  tabAll.classList.add("active");
  tabAll.setAttribute("aria-pressed", "true");

  if (total > 0) {
    renderCards();
    // Smooth scroll to results
    results.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    cardsGrid.innerHTML = "";
    emptyState.hidden = false;
    emptyState.querySelector(".empty-state-title").textContent = "No matches found";
    emptyState.querySelector(".empty-state-hint").textContent =
      "Try different or broader keywords to discover more tools.";
  }
}

// --- Error Retry ---
errorRetryBtn.addEventListener("click", () => {
  if (lastQuery) doSearch(lastQuery);
});

// --- Search ---
async function doSearch(query) {
  setLoading(true);
  results.hidden = true;
  emptyState.hidden = true;
  errorState.hidden = true;
  reasoning.hidden = true;
  resultTabs.hidden = true;
  lastQuery = query;

  try {
    const url = `${API_BASE}/api/search?q=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    const data = await res.json();
    showResults(data);
  } catch (err) {
    console.error("Search error:", err);
    results.hidden = false;
    errorState.hidden = false;
    errorMsg.textContent = escapeHtml(err.message);
    results.scrollIntoView({ behavior: "smooth", block: "start" });
  } finally {
    setLoading(false);
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const query = input.value.trim();
  if (!query) return;
  doSearch(query);
});
