# VibeMatch — Spec

## Gist
A responsive web app where developers describe their project idea in natural language, AI analyzes what tools they need, and npm registry search delivers the most popular matching MCPs, skills, and agents — ranked by GitHub stars with direct links.

## Story
A developer sits down to start a new AI-powered project. They have an idea — say, "build a dashboard that pulls GitHub issues and posts summaries to Slack" — but they don't know which MCPs, skills, or agents exist to accelerate their workflow. Instead of digging through GitHub repos, Discord threads, and scattered documentation, they open VibeMatch, type their idea, and AI breaks it down: "You need a GitHub MCP for API access, a Slack MCP for posting messages, and a summarization agent." The app searches npm for each tool type, ranks results by GitHub stars, and presents the best matches. The developer picks what fits, installs it, and starts building in minutes instead of hours.

## Why
The AI developer tooling ecosystem is exploding — MCPs, skills, agents, plugins — but discovery is broken. Developers waste time searching across fragmented sources, often missing the perfect tool that already exists. VibeMatch closes the discovery gap: describe what you want, get what you need. This removes the friction of "what tools should I use?" and lets developers focus on building.

## Why Not
- **No tool reviews or ratings.** We recommend based on relevance and popularity (GitHub stars), not editorial opinions.
- **No tool creation or hosting.** VibeMatch is a discovery layer, not a registry or package manager.
- **No user accounts or saved preferences.** Stateless — type, get results, leave.
- **No static dataset.** All results come live from npm registry API.
- **No real-time tool health monitoring.** We link to tools but don't verify they're maintained.

## Tech Spec

**Stack:** Vanilla HTML/CSS/JS frontend + Node.js/Express backend (local) / Vercel serverless functions (production). Vibe Proxy (mimo-v2.5, OpenAI-compatible) for AI analysis, npm registry API for tool discovery (public, no token). Deployable on Vercel or any Node host.

**Architecture — 4 main pieces:**

1. **Query Interface** — Clean, responsive input field with a submit button. Mobile-first design. Placeholder text guides the user ("Describe your project idea..."). Supports Enter-to-submit. Shows a loading spinner while fetching results.

2. **AI Analyzer (Backend)** — Sends the user's project idea to Vibe Proxy (mimo-v2.5) with a structured prompt. The AI returns:
   - **Required capabilities** — what the project actually needs (e.g., "GitHub API access", "Slack integration")
   - **Search queries** — optimized npm search queries per tool type (MCP, skill, agent)
   - **Reasoning** — brief explanation of why each tool type is relevant
   Uses the same Vibe proxy that powers Claude Code — no additional API key needed.

3. **npm Search Engine (Backend)** — Takes AI's search queries and runs 3 parallel npm registry searches:
   - MCP queries → npm packages matching `mcp`
   - Skill queries → npm packages matching `skill`
   - Agent queries → npm packages matching `agent`
   Each result: `name`, `full_name`, `description`, `url`, `stars`, `topics[]`, `updated_at`.
   For each package with a GitHub repo, fetches star count from `api.github.com` (3s timeout, 1hr cache).
   Sorted by GitHub stars (production) or npm popularity score (local dev).

4. **Results Display (Frontend)** — Card-based layout showing matched tools. Each card: package name, type badge (MCP / Skill / Agent), description, GitHub star count, link to GitHub or npm. Cards grouped by type with AI's reasoning as section headers. Empty state for no matches.

**Data Flow:**
```
User types project idea
        ↓
Backend → Vibe Proxy (mimo-v2.5): "What tools does this project need?"
        ↓
AI returns: { capabilities, mcp_queries, skill_queries, agent_queries, reasoning }
        ↓
Backend → npm registry API × 3 (parallel, using AI's search terms)
        ↓
For each package → fetch GitHub stars from api.github.com (3s timeout, 1hr cache)
        ↓
Results ranked by stars, grouped by type, capped at 10 per type
        ↓
Frontend displays results with AI's reasoning as context
```

**Styling:** CSS custom properties for theming, CSS Grid/Flexbox for layout, responsive breakpoints at 480px/768px/1024px. Dark mode via `prefers-color-scheme`.

**Deployment:** Frontend (`index.html`, `style.css`, `script.js`) served as static files. Backend (`api/search.js`) as Vercel serverless function. Requires 2 env vars: `VIBE_PROXY` + `VIBE_KEY`. Only 2 npm deps (express, cors) for local dev.

## Definition of Done
- [x] User can type a project description and see relevant MCPs, skills, and agents
- [x] AI correctly identifies required capabilities from natural language
- [x] AI generates targeted npm search queries for each tool type
- [x] Three parallel npm registry searches return real packages
- [x] Results include package name, type badge, description, GitHub stars, and working link
- [x] Results are sorted by popularity (GitHub stars) within each type
- [x] AI's reasoning is shown to the user (why each tool type is relevant)
- [x] Empty state displays helpful message when no matches found
- [x] Loading state shows spinner while results are being fetched
- [x] Responsive layout works on mobile (480px), tablet (768px), and desktop (1024px+)
- [x] Dark mode respects system preference
- [x] All result links point to real GitHub repos or npm packages
- [x] Rate limiting prevents API abuse (10 req/min per IP)
- [x] Uses existing Vibe proxy (VIBE_PROXY + VIBE_KEY) — no new API key needed
- [x] No JavaScript framework dependencies — vanilla JS only
