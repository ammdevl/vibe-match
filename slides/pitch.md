---
marp: true
paginate: true
transition: fade
auto-advance: 20
---

<!-- slide 1 -->
# ⚡ VibeMatch
**Find the right MCPs, skills & agents for any project**

Describe your idea → get curated tool recommendations from npm

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
- **mimo-v2.5 AI** — analyzes your project idea, identifies needed capabilities
- **npm Registry API** — finds real packages ranked by GitHub stars
- **Vanilla JS + Vercel** — fast, no framework overhead

---

<!-- slide 4 -->
# How I Built It
- **MCP**: fetch MCP server for web requests
- **Agent**: vibe-match agent — orchestrates analysis → search → ranking
- **Backend**: Vercel serverless + GitHub stars with 1hr cache

---

<!-- slide 5 -->
# Why It Matters
- **Minutes, not hours** — describe your project, get tools instantly
- **Real results** — live npm data, ranked by GitHub stars
- **AI-powered** — understands intent, not just keywords
- **Free & open source** — anyone can use and improve it

---

<!-- slide 6 -->
# Done Checklist
- [x] Responsive UI (mobile + desktop)
- [x] AI analyzes project ideas
- [x] npm Search returns real MCPs, skills, agents
- [x] Results ranked by GitHub stars (cached 1hr)
- [x] .mcp.json + agent in repo
- [x] 6-slide Marp presentation
