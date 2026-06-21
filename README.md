## ⚡ VibeMatch

Find the right MCPs, skills, and agents for your project idea.

Describe what you want to build → VibeMatch uses AI to analyze your idea and searches the npm registry for the most relevant, popular tools — with direct links to install or learn more.

## Table of Contents
- [⚡ VibeMatch](#-vibematch)
- [Table of Contents](#table-of-contents)
- [How it works](#how-it-works)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Project structure](#project-structure)
- [Features](#features)
- [Contributing](#contributing)
- [License](#license)
- [Contact Me](#contact-me)

## How it works

1. **Type your project idea** — e.g. "a dashboard that tracks GitHub issues and sends Slack alerts"
2. **AI analyzes it** — identifies what capabilities you need (GitHub API, Slack integration, etc.)
3. **Searches npm** — finds real MCPs, skills, and agents matching those capabilities
4. **Get results** — ranked by popularity, grouped by type, with install links

## Tech stack

- **Frontend:** Vanilla HTML/CSS/JS — no framework, fast, responsive
- **Backend:** Node.js + Express
- **AI:** mimo-v2.5 via Vibe Proxy (OpenAI-compatible API)
- **Search:** npm registry API (free, no key needed)
- **Styling:** CSS custom properties, dark mode, mobile-first

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
├── server.js               # Express backend (AI + npm search)
├── package.json            # Dependencies (express, cors)
├── .mcp.json               # MCP configuration
├── .claude/
│   ├── skills/vibe-search/
│   │   └── SKILL.md        # Skill: how to search for tools
│   └── agents/
│       └── vibe-match.md   # Agent: discovery orchestrator
├── slides/
│   └── pitch.md            # 6-slide Marp presentation
├── spec.md                 # Project specification
└── README.md               # This file
```

## Features

- **AI-powered analysis** — understands natural language project descriptions
- **Real results** — searches npm for actual packages, not a static list
- **Three tool types** — MCPs, Claude Code skills, and AI agents
- **Ranked by popularity** — most trusted tools appear first
- **Responsive** — works on mobile, tablet, and desktop
- **Dark mode** — respects system preference
- **Fast** — results cached for 5 minutes, rate-limited to 10 req/min

## Contributing

I'm open to:
- Suggestions for improvements
- Bug reports
- Code reviews and feedback

If you'd like to provide feedback, please open an issue or reach out directly.

## License

This repository is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact Me
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/ammdevl)
[![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.com/users/ammdevl)
[![Telegram](https://img.shields.io/badge/Telegram-26A5E4?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/ammdevl)

---
<div align="center">
💬 Feel free to contact me if you have any questions or feedback.
</div>
