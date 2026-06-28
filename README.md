# ⚡ VibeMatch

Find the right MCPs, skills, and agents for your project idea.

Describe what you want to build → VibeMatch uses AI to analyze your idea and searches the npm registry for the most relevant, popular tools — ranked by GitHub stars with direct links.

## How it works

1. **Type your project idea** — e.g. "a dashboard that tracks GitHub issues and sends Slack alerts"
2. **AI analyzes it** — identifies what capabilities you need (GitHub API, Slack integration, etc.)
3. **Searches npm** — finds real MCPs, skills, and agents matching those capabilities
4. **Get results** — ranked by GitHub stars, grouped by type, with install links

## Tech stack

- **Frontend:** Vanilla HTML/CSS/JS — no framework, fast, responsive
- **Backend:** Vercel serverless functions (production) / Node.js + Express (local dev)
- **AI:** mimo-v2.5 via Vibe Proxy (OpenAI-compatible API)
- **Search:** npm registry API (free, no key needed)
- **Popularity:** GitHub stars (production) / npm popularity score (local dev)
- **Styling:** CSS custom properties, dark/light mode, skeleton loading, responsive

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Set your Vibe proxy credentials
export VIBE_PROXY="https://your-proxy-url"
export VIBE_KEY="your-key"

# 3. Start the server
npm start
# → http://localhost:3000
```

Or use a `.env` file:

```
VIBE_PROXY=https://your-proxy-url
VIBE_KEY=your-key
```

Then run `npm start` (uses `--env-file=.env` automatically).

## Project structure

```
vibe-match/
├── index.html              # Responsive frontend
├── style.css               # Dark/light mode, mobile-first
├── script.js               # Frontend logic
├── server.js               # Express backend (local dev)
├── api/
│   └── search.js           # Vercel serverless function (production)
├── vercel.json             # Vercel deployment config
├── package.json            # Dependencies (express, cors)
├── .mcp.json               # MCP configuration
├── .claude/
│   ├── settings.local.json # MCP server settings
│   └── agents/
│       └── vibe-match.md   # Agent: discovery orchestrator
├── slides/
│   └── pitch.md            # 6-slide Marp presentation
├── spec.md                 # Project specification
├── README.md               # This file
└── LICENSE                 # MIT License
```

## Features

- **AI-powered analysis** — understands natural language project descriptions
- **Real results** — searches npm for actual packages, not a static list
- **Three tool types** — MCPs, Claude Code skills, and AI agents with tab filtering
- **Ranked by popularity** — shows GitHub star counts and weekly npm downloads
- **Skeleton loading** — smooth placeholder animations while searching
- **Responsive** — works on mobile, tablet, and desktop
- **Dark mode** — respects system preference, with light mode support
- **Fast** — rate-limited to 10 req/min per IP

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Set env vars
vercel env add VIBE_PROXY
vercel env add VIBE_KEY

# Deploy to production
vercel --prod
```

Or deploy via the web dashboard:
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Settings → Environment Variables → add `VIBE_PROXY` and `VIBE_KEY`
4. Deploy

## License

MIT — see [LICENSE](./LICENSE)
