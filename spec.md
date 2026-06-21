# VibeMatch — Spec

## Gist
A responsive web app where developers describe their project idea in natural language, Gemini AI analyzes what tools they need, and GitHub Search delivers the most popular matching MCPs, skills, and agents — with direct links to repos.

## Story
A developer sits down to start a new AI-powered project. They have an idea — say, "build a dashboard that pulls GitHub issues and posts summaries to Slack" — but they don't know which MCPs, skills, or agents exist to accelerate their workflow. Instead of digging through GitHub repos, Discord threads, and scattered documentation, they open VibeMatch, type their idea, and Gemini breaks it down: "You need a GitHub MCP for API access, a Slack MCP for posting messages, and a summarization agent." The app searches GitHub for each tool type, ranks results by popularity, and presents the best matches. The developer picks what fits, installs it, and starts building in minutes instead of hours.

## Why
The AI developer tooling ecosystem is exploding — MCPs, skills, agents, plugins — but discovery is broken. Developers waste time searching across fragmented sources, often missing the perfect tool that already exists. VibeMatch closes the discovery gap: describe what you want, get what you need. This removes the friction of "what tools should I use?" and lets developers focus on building.

## Why Not
- **No tool reviews or ratings.** We recommend based on relevance and GitHub popularity (stars), not editorial opinions.
- **No tool creation or hosting.** VibeMatch is a discovery layer, not a registry or package manager.
- **No user accounts or saved preferences.** Stateless — type, get results, leave.
- **No static dataset.** All results come live from GitHub Search API.
- **No real-time tool health monitoring.** We link to tools but don't verify they're maintained.

## Tech Spec

**Stack:** Vanilla HTML/CSS/JS frontend + Node.js/Express backend. Vibe Proxy (mimo-v2.5, OpenAI-compatible) for AI analysis, GitHub Search API for tool discovery (public, no token). Deployable on Vercel, Netlify, or any Node host.

**Architecture — 4 main pieces:**

1. **Query Interface** — Clean, responsive input field with a submit button. Mobile-first design. Placeholder text guides the user ("Describe your project idea..."). Supports Enter-to-submit. Shows a loading spinner while fetching results.

2. **AI Analyzer (Backend)** — Sends the user's project idea to Vibe Proxy (mimo-v2.5) with a structured prompt. The AI returns:
   - **Required capabilities** — what the project actually needs (e.g., "GitHub API access", "Slack integration")
   - **Search queries** — optimized GitHub search queries per tool type (MCP, skill, agent)
   - **Reasoning** — brief explanation of why each tool type is relevant
   Uses the same Vibe proxy that powers Claude Code — no additional API key needed.

3. **GitHub Search Engine (Backend)** — Takes Gemini's search queries and runs 3 parallel GitHub Search API calls:
   - MCP queries → GitHub repos with `topic:mcp`
   - Skill queries → GitHub repos with `topic:skill` OR `topic:claude-code-skill`
   - Agent queries → GitHub repos with `topic:agent` OR `topic:ai-agent`
   Each result: `name`, `full_name`, `description`, `html_url`, `stargazers_count`, `topics[]`, `updated_at`. Sorted by stars.

4. **Results Display (Frontend)** — Card-based layout showing matched tools. Each card: repo name, type badge (MCP / Skill / Agent), description, star count, last updated, "View on GitHub" link. Cards grouped by type with Gemini's reasoning as section headers. Empty state for no matches.

**Data Flow:**
```
User types project idea
        ↓
Backend → Vibe Proxy (mimo-v2.5): "What tools does this project need?"
        ↓
AI returns: { capabilities, mcp_queries, skill_queries, agent_queries, reasoning }
        ↓
Backend → GitHub Search API × 3 (parallel, using Gemini's search terms)
        ↓
Results ranked by stars, grouped by type
        ↓
Frontend displays results with Gemini's reasoning as context
```

**Styling:** CSS custom properties for theming, CSS Grid/Flexbox for layout, responsive breakpoints at 480px/768px/1024px. Dark mode via `prefers-color-scheme`.

**Deployment:** `index.html` + `style.css` + `script.js` (frontend) + `server.js` + `package.json` (backend). Requires 2 env vars: `VIBE_PROXY` + `VIBE_KEY` (same as Claude Code). Only 2 npm deps (express, cors). Single `npm start` to run.

## Definition of Done
- [ ] User can type a project description and see relevant MCPs, skills, and agents
- [ ] AI correctly identifies required capabilities from natural language
- [ ] AI generates targeted GitHub search queries for each tool type
- [ ] Three parallel GitHub API searches return real repos
- [ ] Results include repo name, type badge, description, star count, and working GitHub link
- [ ] Results are sorted by popularity (stars) within each type
- [ ] AI's reasoning is shown to the user (why each tool type is relevant)
- [ ] Empty state displays helpful message when no matches found
- [ ] Loading state shows spinner while results are being fetched
- [ ] Responsive layout works on mobile (480px), tablet (768px), and desktop (1024px+)
- [ ] Dark mode respects system preference
- [ ] All result links point to real GitHub repos
- [ ] Backend caches GitHub responses for 5 minutes
- [ ] Rate limiting prevents API abuse (10 req/min per IP)
- [ ] Uses existing Vibe proxy (VIBE_PROXY + VIBE_KEY) — no new API key needed
- [ ] No JavaScript framework dependencies — vanilla JS only
