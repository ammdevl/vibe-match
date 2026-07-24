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
const toastContainer = document.getElementById("toastContainer");
const exampleQueries = document.getElementById("exampleQueries");
const resultsSummary = document.getElementById("resultsSummary");
const quickFind = document.getElementById("quickFind");
const aboutSection = document.getElementById("aboutSection");
const carouselSection = document.getElementById("carouselSection");

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

// --- Toast Notifications ---
function showToast(message, type = "info") {
  const icons = { success: "✓", error: "✕", info: "ℹ" };
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${escapeHtml(message)}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("toast-out");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// --- Typing Placeholder Animation ---
const PLACEHOLDERS = [
  "Describe your project idea...",
  "e.g., AI-powered recipe app with meal planning",
  "e.g., Real-time multiplayer game backend",
  "e.g., Social media dashboard with analytics",
  "e.g., Blockchain-based supply chain tracker",
  "e.g., Fitness tracker with AI personal trainer",
  "e.g., Music streaming app with smart playlists",
  "e.g., Project management tool with AI task breakdown",
];

let placeholderIdx = 0;
let placeholderTimeout = null;

function animatePlaceholder() {
  if (document.activeElement === input || input.value.trim()) return;

  const full = PLACEHOLDERS[placeholderIdx];
  let charIdx = 0;
  let deleting = false;

  function tick() {
    if (document.activeElement === input || input.value.trim()) {
      input.placeholder = "Describe your project idea...";
      return;
    }

    if (!deleting) {
      input.placeholder = full.slice(0, ++charIdx);
      if (charIdx === full.length) {
        placeholderTimeout = setTimeout(() => { deleting = true; tick(); }, 2000);
        return;
      }
      placeholderTimeout = setTimeout(tick, 60 + Math.random() * 40);
    } else {
      input.placeholder = full.slice(0, --charIdx);
      if (charIdx === 0) {
        placeholderIdx = (placeholderIdx + 1) % PLACEHOLDERS.length;
        placeholderTimeout = setTimeout(animatePlaceholder, 500);
        return;
      }
      placeholderTimeout = setTimeout(tick, 30);
    }
  }

  tick();
}

// Start typing animation after a delay
setTimeout(animatePlaceholder, 1500);

input.addEventListener("focus", () => {
  clearTimeout(placeholderTimeout);
  input.placeholder = "Describe your project idea...";
});

input.addEventListener("blur", () => {
  if (!input.value.trim()) setTimeout(animatePlaceholder, 1000);
});

// --- Example Query Chips ---
exampleQueries.addEventListener("click", (e) => {
  const chip = e.target.closest(".example-chip");
  if (!chip) return;
  const query = chip.dataset.query;
  input.value = query;
  updateClearButton();
  doSearch(query);
});

// --- Search History (localStorage) ---
const HISTORY_KEY = "vibe-search-history";
const MAX_HISTORY = 10;
const searchHistoryPanel = document.getElementById("searchHistory");

function getSearchHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveSearchHistory(history) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY))); } catch {}
}

function addToHistory(query) {
  const trimmed = query.trim();
  if (!trimmed) return;
  let history = getSearchHistory();
  // Remove duplicate if exists
  history = history.filter(h => h.query !== trimmed);
  // Add to front
  history.unshift({ query: trimmed, timestamp: Date.now() });
  saveSearchHistory(history);
  renderSearchHistory();
}

function removeFromHistory(query) {
  let history = getSearchHistory();
  history = history.filter(h => h.query !== query);
  saveSearchHistory(history);
  renderSearchHistory();
  // Refocus input
  input.focus();
}

function clearSearchHistory() {
  saveSearchHistory([]);
  renderSearchHistory();
  input.focus();
}

function renderSearchHistory() {
  if (!searchHistoryPanel) return;
  const history = getSearchHistory();
  searchHistoryPanel.hidden = history.length === 0;
  if (history.length === 0) return;

  searchHistoryPanel.innerHTML = `
    <div class="history-header">
      <span class="history-title">Recent searches</span>
      <button class="history-clear-btn" id="historyClearBtn" aria-label="Clear all history">Clear</button>
    </div>
    <div class="history-list">
      ${history.map(h => `
        <div class="history-item" data-query="${escapeHtml(h.query)}">
          <span class="history-query">${escapeHtml(h.query)}</span>
          <button class="history-remove" data-query="${escapeHtml(h.query)}" aria-label="Remove">&times;</button>
        </div>
      `).join("")}
    </div>
  `;

  // Delegate events
  const items = searchHistoryPanel.querySelectorAll(".history-item");
  items.forEach(item => {
    item.addEventListener("click", (e) => {
      if (e.target.closest(".history-remove")) return;
      const q = item.dataset.query;
      if (q) { input.value = q; updateClearButton(); doSearch(q); }
    });
  });

  const removes = searchHistoryPanel.querySelectorAll(".history-remove");
  removes.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeFromHistory(btn.dataset.query);
    });
  });

  const clearBtn = document.getElementById("historyClearBtn");
  if (clearBtn) clearBtn.addEventListener("click", clearSearchHistory);
}

// Show/hide history on focus
input.addEventListener("focus", () => {
  const history = getSearchHistory();
  if (history.length > 0) {
    renderSearchHistory();
    searchHistoryPanel.hidden = false;
  }
});

// Close history when clicking outside
document.addEventListener("click", (e) => {
  if (searchHistoryPanel && !searchHistoryPanel.hidden) {
    if (!e.target.closest("#searchForm") && !e.target.closest("#searchHistory")) {
      searchHistoryPanel.hidden = true;
    }
  }
});

// --- Keyboard Shortcuts ---
document.addEventListener("keydown", (e) => {
  // "/" to focus search (unless already in an input)
  if (e.key === "/" && document.activeElement !== input && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    input.focus();
    input.select();
  }
  // Escape to blur
  if (e.key === "Escape") {
    input.blur();
  }
});

// --- Helpers ---
function formatStars(n) {
  if (n === null || n === undefined) return "—";
  if (typeof n !== "number") return "—";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(2)}k`;
  return n <= 0 ? "—" : n.toString();
}

function formatDownloads(n) {
  if (n === null || n === undefined) return null;
  if (typeof n !== "number") return null;
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n <= 0 ? null : n.toString();
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

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// --- Copy to Clipboard ---
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("Link copied!", "success");
  } catch {
    showToast("Failed to copy", "error");
  }
}

// --- Animated Counter ---
function animateCount(el, target) {
  const duration = 400;
  const start = parseInt(el.textContent) || 0;
  if (start === target) return;
  const startTime = performance.now();

  function tick(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = Math.round(start + (target - start) * eased);
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
  // Bump animation
  el.classList.add("bump");
  setTimeout(() => el.classList.remove("bump"), 300);
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

  // Detailed analytics: version, quality score, publisher, last updated
  const versionHtml = item.version
    ? `<span class="card-version" title="Version">📦 v${escapeHtml(item.version)}</span>`
    : "";
  const qualityHtml = item.quality
    ? `<span class="card-quality" title="Quality score">📊 ${item.quality}%</span>`
    : "";
  const publisherHtml = item.publisher
    ? `<span class="card-publisher" title="Publisher">👤 ${escapeHtml(item.publisher)}</span>`
    : "";
  const updatedHtml = item.updated_at
    ? `<span class="card-updated" title="Last updated">🕐 ${new Date(item.updated_at).toLocaleDateString()}</span>`
    : "";

  // Topic tags
  const topicHtml = (item.topics && item.topics.length > 0)
    ? `<div class="card-tags">${item.topics.slice(0, 3).map(t => `<span class="card-tag">${escapeHtml(t)}</span>`).join("")}</div>`
    : "";

  const urlHtml = safeUrl
    ? `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer" class="card-link">${linkText} ${linkIcon}</a>`
    : "";

  const desc = escapeHtml(item.description || "No description available");
  const isLongDesc = (item.description || "").length > 120;

  // Unique ID for comparison tracking
  const itemId = `${type}-${item.name || item.full_name || Math.random().toString(36).slice(2)}`;

  return `
    <div class="card card-tilt" data-type="${type}" data-compare-id="${escapeHtml(itemId)}" style="animation-delay: var(--card-delay, 0s)">
      <div class="card-actions">
        ${safeUrl ? `<button class="card-action-btn" data-copy="${escapeHtml(safeUrl)}" title="Copy link"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>` : ""}
        <button class="card-compare-btn" title="Compare" aria-label="Add to comparison">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><path d="m8 3-5 5"/><path d="M12 20L12 12"/><path d="m3 21 18-18"/></svg>
        </button>
      </div>
      <div class="card-compare-check">
        <input type="checkbox" class="compare-checkbox" id="cmp-${escapeHtml(itemId)}" aria-label="Compare ${escapeHtml(item.full_name || item.name)}" />
        <label for="cmp-${escapeHtml(itemId)}" class="compare-label">compare</label>
      </div>
      <div class="card-header">
        <span class="card-name">${escapeHtml(item.full_name || item.name || "")}</span>
        <div class="card-stats">
          ${dlHtml}
          <span class="card-stars">⭐ ${stars}</span>
        </div>
      </div>
      <div class="card-meta">
        ${versionHtml}${qualityHtml}${publisherHtml}${updatedHtml}
      </div>
      <div class="card-desc-wrapper">
        <p class="card-desc">${desc}</p>
        ${isLongDesc ? '<button class="card-desc-toggle">more</button>' : ""}
      </div>
      ${topicHtml}
      <div class="card-footer">
        <span class="card-footer-left">
          <span class="type-badge ${type}">${type.toUpperCase()}</span>
          ${item.registry ? `<span class="registry-badge registry-${item.registry}">${item.registry}</span>` : ""}
        </span>
        ${urlHtml}
      </div>
    </div>
  `;
}

// --- Card Interactions (delegate) ---

// --- Comparison State ---
const compareItems = new Map(); // id -> { item, type }

function updateCompareBar() {
  const bar = document.getElementById("compareBar");
  const count = document.getElementById("compareCount");
  const countNum = compareItems.size;
  if (!bar || !count) return;
  bar.hidden = countNum === 0;
  count.textContent = countNum;
  document.getElementById("compareBtn").disabled = countNum < 2;
}

function addToCompare(id, item, type) {
  if (compareItems.size >= 4) {
    showToast("Maximum 4 items for comparison", "error");
    return false;
  }
  if (compareItems.has(id)) return true;
  compareItems.set(id, { item, type });
  updateCompareBar();
  const cb = document.getElementById(`cmp-${CSS.escape(id)}`);
  if (cb) cb.checked = true;
  return true;
}

function removeFromCompare(id) {
  compareItems.delete(id);
  updateCompareBar();
  const cb = document.getElementById(`cmp-${CSS.escape(id)}`);
  if (cb) cb.checked = false;
}

function clearCompare() {
  compareItems.forEach((_, id) => {
    const cb = document.getElementById(`cmp-${CSS.escape(id)}`);
    if (cb) cb.checked = false;
  });
  compareItems.clear();
  updateCompareBar();
}

function openCompareModal() {
  if (compareItems.size < 2) {
    showToast("Select at least 2 items to compare", "error");
    return;
  }
  const modal = document.getElementById("compareModal");
  const body = document.getElementById("compareModalBody");
  if (!modal || !body) return;

  const entries = Array.from(compareItems.entries());
  const rows = [
    { label: "Name", extract: (e) => escapeHtml(e.item.full_name || e.item.name) },
    { label: "Type", extract: (e) => `<span class="type-badge ${e.type}">${e.type.toUpperCase()}</span>` },
    { label: "Stars", extract: (e) => formatStars(e.item.stars) },
    { label: "Downloads", extract: (e) => formatDownloads(e.item.weeklyDownloads || e.item.downloads) || "—" },
    { label: "Version", extract: (e) => e.item.version ? `v${escapeHtml(e.item.version)}` : "—" },
    { label: "Quality", extract: (e) => e.item.quality ? `${e.item.quality}%` : "—" },
    { label: "Popularity", extract: (e) => e.item.popularity ? `${e.item.popularity}%` : "—" },
    { label: "Publisher", extract: (e) => escapeHtml(e.item.publisher || "—") },
    { label: "Updated", extract: (e) => e.item.updated_at ? new Date(e.item.updated_at).toLocaleDateString() : "—" },
    { label: "Description", extract: (e) => escapeHtml((e.item.description || "—").slice(0, 120)) },
  ];

  let html = `<table class="compare-table"><thead><tr><th>Metric</th>`;
  entries.forEach(([id, e]) => {
    html += `<th>${escapeHtml(e.item.full_name || e.item.name || id)}</th>`;
  });
  html += `</tr></thead><tbody>`;
  rows.forEach((r) => {
    html += `<tr><td class="compare-metric">${r.label}</td>`;
    entries.forEach(([_, e]) => {
      html += `<td>${r.extract(e)}</td>`;
    });
    html += `</tr>`;
  });
  html += `</tbody></table>`;

  body.innerHTML = html;
  modal.hidden = false;
  document.body.classList.add("modal-open");
}

// Delegate card interactions from the grid
cardsGrid.addEventListener("click", (e) => {
  // Copy link
  const copyBtn = e.target.closest("[data-copy]");
  if (copyBtn) {
    e.preventDefault();
    copyToClipboard(copyBtn.dataset.copy);
    return;
  }
  // Compare button (toggle)
  const cmpBtn = e.target.closest(".card-compare-btn");
  if (cmpBtn) {
    e.preventDefault();
    const card = cmpBtn.closest(".card");
    if (!card) return;
    const id = card.dataset.compareId;
    if (!id) return;
    if (compareItems.has(id)) {
      removeFromCompare(id);
    } else {
      const found = allCards.find(c => `${c.type}-${c.item.name || c.item.full_name}` === id);
      if (found) addToCompare(id, found.item, found.type);
    }
    return;
  }
  // Compare checkbox
  const cb = e.target.closest(".compare-checkbox");
  if (cb) {
    const card = cb.closest(".card");
    if (!card) return;
    const id = card.dataset.compareId;
    if (!id) return;
    if (cb.checked) {
      const found = allCards.find(c => `${c.type}-${c.item.name || c.item.full_name}` === id);
      if (found) { if (!addToCompare(id, found.item, found.type)) cb.checked = false; }
    } else {
      removeFromCompare(id);
    }
    return;
  }
  // Expand/collapse description
  const toggle = e.target.closest(".card-desc-toggle");
  if (toggle) {
    const desc = toggle.previousElementSibling;
    desc.classList.toggle("expanded");
    toggle.textContent = desc.classList.contains("expanded") ? "less" : "more";
  }
});

// --- Card Tilt Effect (desktop only) ---
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

if (!isTouchDevice) {
  cardsGrid.addEventListener("mousemove", (e) => {
    const card = e.target.closest(".card-tilt");
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `translateY(-3px) perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
  });

  cardsGrid.addEventListener("mouseenter", (e) => {
    const card = e.target.closest(".card-tilt");
    if (card) card.style.transition = "transform 0.1s ease-out, border-color var(--transition), box-shadow var(--transition)";
  }, true);

  // Reset tilt when mouse leaves a card or the grid
  cardsGrid.addEventListener("mouseleave", (e) => {
    const card = e.target.closest(".card-tilt");
    if (card) {
      card.style.transition = "transform 0.4s ease-out, border-color var(--transition), box-shadow var(--transition)";
      card.style.transform = "";
    }
  }, true);

  cardsGrid.addEventListener("mouseleave", () => {
    cardsGrid.querySelectorAll(".card-tilt").forEach((c) => {
      c.style.transition = "transform 0.4s ease-out, border-color var(--transition), box-shadow var(--transition)";
      c.style.transform = "";
    });
  });
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
    exampleQueries.classList.add("hidden");
    if (quickFind) quickFind.classList.add("hidden");
    if (aboutSection) aboutSection.classList.add("hidden");
    if (carouselSection) carouselSection.classList.add("hidden");
    document.querySelector(".search-box")?.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    skeleton.hidden = true;
  }
}

// --- Clear Button ---
function updateClearButton() {
  const empty = input.value.trim() === "";
  clearBtn.hidden = empty;
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

  renderCards(true);
}

tabAll.addEventListener("click", () => switchTab("all"));
tabMcp.addEventListener("click", () => switchTab("mcp"));
tabSkill.addEventListener("click", () => switchTab("skill"));
tabAgent.addEventListener("click", () => switchTab("agent"));

function renderCards(isTabSwitch = false) {
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
      return html.replace("var(--card-delay, 0s)", `${i * 0.06}s`);
    }).join("");

    // Add tab switch animation
    if (isTabSwitch) {
      cardsGrid.classList.add("tab-switching");
      setTimeout(() => cardsGrid.classList.remove("tab-switching"), 300);
    }
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

  // Save to search history
  addToHistory(lastQuery);

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

  // Show results summary
  resultsSummary.hidden = false;
  resultsSummary.innerHTML = `Found <strong>${total}</strong> tools for "<span class="summary-query">${escapeHtml(lastQuery)}</span>"`;

  // Update tab counts with animation
  animateCount(tabCountAll, total);
  animateCount(tabCountMcp, totalMcp);
  animateCount(tabCountSkill, totalSkill);
  animateCount(tabCountAgent, totalAgent);

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

// --- Compare Bar & Modal Controls ---
document.addEventListener("click", (e) => {
  const viewBtn = e.target.closest("#compareBtn");
  if (viewBtn) { openCompareModal(); return; }

  const clearBtn = e.target.closest("#compareClearBtn");
  if (clearBtn) { clearCompare(); return; }

  const closeBtn = e.target.closest("#compareModalClose");
  if (closeBtn) {
    document.getElementById("compareModal").hidden = true;
    document.body.classList.remove("modal-open");
    return;
  }

  // Click outside modal
  const overlay = e.target.closest("#compareModal");
  if (overlay && !e.target.closest(".compare-modal")) {
    document.getElementById("compareModal").hidden = true;
    document.body.classList.remove("modal-open");
  }
});

// Escape closes modal
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const modal = document.getElementById("compareModal");
    if (modal && !modal.hidden) {
      modal.hidden = true;
      document.body.classList.remove("modal-open");
    }
  }
});

// --- Compare Bar & Modal ---
document.addEventListener("click", (e) => {
  const openBtn = e.target.closest("#compareBtn");
  if (openBtn) { openCompareModal(); return; }

  const clearBtn = e.target.closest("#compareClearBtn");
  if (clearBtn) { clearCompare(); return; }

  const closeModal = e.target.closest("#compareModalClose");
  if (closeModal) {
    document.getElementById("compareModal").hidden = true;
    document.body.classList.remove("modal-open");
    return;
  }

  // Click outside modal content
  const overlay = e.target.closest("#compareModal");
  if (overlay && !e.target.closest(".compare-modal")) {
    document.getElementById("compareModal").hidden = true;
    document.body.classList.remove("modal-open");
    return;
  }
});

// Escape key closes modal
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const modal = document.getElementById("compareModal");
    if (modal && !modal.hidden) {
      modal.hidden = true;
      document.body.classList.remove("modal-open");
    }
  }
});

// --- Search ---
async function doSearch(query) {
  setLoading(true);
  results.hidden = true;
  emptyState.hidden = true;
  errorState.hidden = true;
  reasoning.hidden = true;
  resultTabs.hidden = true;
  resultsSummary.hidden = true;
  lastQuery = query;
  clearCompare();
  // Clear comparison state from previous search
  compareItems.clear();
  updateCompareBar();

  try {
    // Read selected registry
    const regRadio = document.querySelector('input[name="registry"]:checked');
    const registry = regRadio ? regRadio.value : "npm";
    const url = `${API_BASE}/api/search?q=${encodeURIComponent(query)}&registry=${registry}`;
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));

      // Show rate limit toast
      if (res.status === 429) {
        showToast("Rate limit exceeded. Please wait a moment.", "error");
      }

      throw new Error(err.error || `HTTP ${res.status}`);
    }
    const data = await res.json();
    showResults(data);
  } catch (err) {
    console.error("Search error:", err);
    results.hidden = false;
    errorState.hidden = false;
    errorMsg.textContent = escapeHtml(err.message);
    // Shake animation
    errorState.classList.add("shake");
    setTimeout(() => errorState.classList.remove("shake"), 600);
    results.scrollIntoView({ behavior: "smooth", block: "start" });
  } finally {
    setLoading(false);
    exampleQueries.classList.add("hidden");
    if (quickFind) quickFind.classList.add("hidden");
    if (aboutSection) aboutSection.classList.add("hidden");
    if (carouselSection) carouselSection.classList.add("hidden");
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const query = input.value.trim();
  if (!query) return;
  doSearch(query);
});

// --- Carousel (Flowbite-style infinite loop) ---
(function () {
  const track = document.getElementById("carouselTrack");
  const prevBtn = document.getElementById("carouselPrev");
  const nextBtn = document.getElementById("carouselNext");
  const dots = document.querySelectorAll(".carousel-dot");
  if (!track || !prevBtn || !nextBtn) return;

  const INTERVAL = 5000;
  const SPEED = 500; // transition duration in ms

  // --- Clone first & last for infinite scrolling ---
  const slides = track.querySelectorAll(".carousel-slide");
  const total = slides.length;

  const firstClone = slides[0].cloneNode(true);
  const lastClone = slides[total - 1].cloneNode(true);

  // Layout: [clone-last] [real-0] [real-1] [real-2] [clone-first]
  track.appendChild(firstClone);
  track.insertBefore(lastClone, slides[0]);

  const COUNT = total + 2; // 5
  let index = 1;           // start at real slide 0
  let timer = null;
  let busy = false;        // block input while transitioning

  track.style.transform = `translateX(-${index * 100}%)`;

  function updateDot(realIdx) {
    dots.forEach((d, i) => d.classList.toggle("active", i === realIdx));
  }

  function realIdx() {
    if (index === 0) return total - 1;
    if (index === COUNT - 1) return 0;
    return index - 1;
  }

  function moveTo(nextIdx) {
    if (busy) return;
    busy = true;

    index = nextIdx;
    track.style.transition = `transform ${SPEED}ms ease`;
    track.style.transform = `translateX(-${index * 100}%)`;
    updateDot(realIdx());
  }

  // After the slide animation ends, check if we landed on a clone and warp silently
  track.addEventListener("transitionend", () => {
    busy = false;
    if (index === 0) {
      // Landed on clone of last slide — jump to real last slide
      index = total;
      track.style.transition = "none";
      track.style.transform = `translateX(-${index * 100}%)`;
      updateDot(total - 1);
    } else if (index === COUNT - 1) {
      // Landed on clone of first slide — jump to real first slide
      index = 1;
      track.style.transition = "none";
      track.style.transform = `translateX(-${index * 100}%)`;
      updateDot(0);
    }
  });

  function next() { moveTo(index + 1); }
  function prev() { moveTo(index - 1); }

  function startAuto() {
    stopAuto();
    timer = setInterval(next, INTERVAL);
  }

  function stopAuto() {
    clearInterval(timer);
    timer = null;
  }

  // --- Controls ---
  prevBtn.addEventListener("click", () => { prev(); startAuto(); });
  nextBtn.addEventListener("click", () => { next(); startAuto(); });
  dots.forEach((d) => d.addEventListener("click", () => {
    const target = parseInt(d.dataset.slide) + 1; // real→visual
    if (target === index) return;
    moveTo(target);
    startAuto();
  }));

  // Keyboard
  document.addEventListener("keydown", (e) => {
    if (!carouselSection || carouselSection.classList.contains("hidden")) return;
    if (!document.activeElement.closest(".carousel")) return;
    if (e.key === "ArrowLeft") { prev(); startAuto(); }
    if (e.key === "ArrowRight") { next(); startAuto(); }
  });

  // Touch/swipe
  let startX = 0;
  track.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener("touchend", (e) => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? next() : prev();
      startAuto();
    }
  }, { passive: true });

  // Pause on hover
  track.addEventListener("mouseenter", stopAuto);
  track.addEventListener("mouseleave", startAuto);

  // Init
  updateDot(0);
  startAuto();
})();

// --- Init ---
// Full page reset on every load (refresh / back / forward) — like a fresh visit
window.addEventListener("pageshow", () => {
  window.scrollTo({ top: 0, behavior: "instant" });
  input.value = "";
  lastQuery = "";
  updateClearButton();
  results.hidden = true;
  emptyState.hidden = true;
  errorState.hidden = true;
  skeleton.hidden = true;
  reasoning.hidden = true;
  resultTabs.hidden = true;
  resultsSummary.hidden = true;
  exampleQueries.classList.remove("hidden");
  if (quickFind) quickFind.classList.remove("hidden");
  if (aboutSection) aboutSection.classList.remove("hidden");
  if (carouselSection) carouselSection.classList.remove("hidden");
  if (searchHistoryPanel) searchHistoryPanel.hidden = true;
  allCards = [];
  activeTab = "all";
  cardsGrid.innerHTML = "";
});
