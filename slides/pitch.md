---
marp: true
paginate: true
transition: fade
auto-advance: 20
---

<!-- slide 1 -->
# ⚡ VibeMatch
**Find the right MCPs, skills & agents for any project**

Describe your idea → get curated tool recommendations from GitHub

---

<!-- slide 2 -->
# The Problem
Developers waste hours searching for AI tools across:
- GitHub repos, Discord threads, scattered docs
- No single place to discover MCPs, skills, and agents
- The ecosystem is growing too fast to track manually

---

<!-- slide 3 -->
# What I Built
A responsive web app powered by:
- **Claude API** — analyzes your project idea, identifies needed capabilities
- **GitHub Search API** — finds real repos ranked by popularity
- **Vanilla JS + Express** — fast, no framework overhead

---

<!-- slide 4 -->
# How I Built It
- **MCP**: GitHub MCP + Brave Search MCP for repo discovery
- **Skill**: vibe-search — teaches Claude how to query for tools
- **Agent**: vibe-match agent — orchestrates analysis → search → ranking

---

<!-- slide 5 -->
# Why It Matters
- **Minutes, not hours** — describe your project, get tools instantly
- **Real results** — live GitHub data, ranked by stars
- **AI-powered** — Claude understands intent, not just keywords
- **Open source** — anyone can use and improve it

---

<!-- slide 6 -->
# Done Checklist
- [x] Responsive UI (mobile + desktop)
- [x] Claude API analyzes project ideas
- [x] GitHub Search returns real MCPs, skills, agents
- [x] Results ranked by popularity
- [x] .mcp.json + skill + agent in repo
- [x] 6-slide Marp presentation
