# VibeMatch Search Skill

This skill teaches Claude how to search for MCPs, skills, and agents on GitHub
that match a user's project idea.

## When to use

Use this skill when a user describes a project idea and needs to discover which
MCP servers, Claude Code skills, or AI agents would help them build it.

## How it works

1. Read the user's project description carefully
2. Identify the core capabilities needed (API access, file operations, web search,
   database, notifications, etc.)
3. For each capability, generate a targeted GitHub search query using these topic filters:
   - MCPs: `topic:mcp` or `topic:mcp-server` combined with capability keywords
   - Skills: `topic:claude-code-skill` or `topic:skill` combined with capability keywords
   - Agents: `topic:agent` or `topic:ai-agent` combined with capability keywords
4. Use the GitHub MCP to search repositories with these queries
5. Rank results by stars (popularity) and relevance to the project
6. Return a structured list with: name, type (MCP/Skill/Agent), description,
   star count, and GitHub link

## Search query patterns

For a project needing "GitHub API access and Slack notifications":
- MCP: `github mcp server api` → filter by topic:mcp
- Skill: `claude code skill github` → filter by topic:skill
- Agent: `ai agent slack notification` → filter by topic:agent

## Output format

Return results grouped by type (MCPs first, then Skills, then Agents).
Each entry must include:
- Repository name and owner
- One-line description from GitHub
- Star count
- Direct link to the repository
- Why it's relevant to the user's project
