const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_QUERY_LENGTH = 500;

app.use(cors());
app.use(express.json());

// Only serve whitelisted static files — NEVER .env, node_modules, or server code
const ALLOWED_STATIC = /\.(html|css|js|png|svg|ico|webp|jpg)$/i;
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) return next(); // passthrough API routes
  if (req.method === "GET" && req.path !== "/" && !ALLOWED_STATIC.test(req.path)) {
    return res.status(404).json({ error: "Not found" });
  }
  next();
});
app.use(express.static(".", {
  index: "index.html",
  setHeaders: (res, filePath) => {
    if (filePath.endsWith(".html")) {
      res.setHeader("Content-Security-Policy", "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; img-src 'self' data:;");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("X-Frame-Options", "DENY");
      res.setHeader("Referrer-Policy", "no-referrer");
    }
  },
}));

const VIBE_PROXY = process.env.VIBE_PROXY || "";
const VIBE_KEY = process.env.VIBE_KEY || "";

// --- Sanitize user input: strip control chars, truncate ---
function sanitizeQuery(raw) {
  return raw
    .replace(/[\x00-\x1f\x7f]/g, "") // strip control characters
    .replace(/["\\]/g, "")            // strip quotes and backslashes (prompt injection defense)
    .slice(0, MAX_QUERY_LENGTH)
    .trim();
}

// --- In-memory cache (5 min TTL, max 200 entries) ---
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;
const MAX_CACHE_SIZE = 200;

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  if (cache.size >= MAX_CACHE_SIZE) {
    // Evict oldest entry
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
  cache.set(key, { data, ts: Date.now() });
}

// --- Rate limiter (10 req/min per IP) ---
const rateLimits = new Map();
const RATE_WINDOW = 60 * 1000;
const RATE_MAX = 10;

function checkRate(ip) {
  const now = Date.now();
  const entry = rateLimits.get(ip) || { count: 0, start: now };
  if (now - entry.start > RATE_WINDOW) {
    entry.count = 1;
    entry.start = now;
  } else {
    entry.count++;
  }
  rateLimits.set(ip, entry);
  return entry.count <= RATE_MAX;
}

// --- Vibe Proxy (OpenAI-compatible API) ---
async function askAI(projectIdea) {
  const system = `You are a JSON API. You MUST respond with ONLY a valid JSON object. No markdown. No code fences. No explanation. Just the raw JSON object.`;

  // User input placed inside <project> tags to prevent prompt injection.
  // No quotes, backslashes, or control characters survive sanitizeQuery().
  const user = `Given this project idea, find the MCPs, skills, and agents needed.

<project>
${projectIdea}
</project>

Respond with this exact JSON structure and nothing else:
{"capabilities":["cap1","cap2"],"mcp_queries":["query1"],"skill_queries":["query1"],"agent_queries":["query1"],"reasoning":{"mcp":"why mcp helps","skill":"why skill helps","agent":"why agent helps"}}

mcp_queries: 1-3 short GitHub search terms for topic:mcp repos
skill_queries: 1-3 short terms for topic:skill repos
agent_queries: 1-3 short terms for topic:agent repos
Keep queries 2-4 words. Focus on what the project actually needs.`;

  const res = await fetch(`${VIBE_PROXY}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${VIBE_KEY}`,
    },
    body: JSON.stringify({
      model: "mimo-v2.5",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: 8192,
      temperature: 0.1,
    }),
  });

  const data = await res.json();
  console.log("AI full response:", JSON.stringify(data, null, 2));

  if (!res.ok) {
    throw new Error(`AI API ${res.status}: ${JSON.stringify(data)}`);
  }

  // Thinking models put response in content, thinking in reasoning_content
  const msg = data.choices?.[0]?.message || {};
  const text = msg.content || "";

  // If content is empty, try to extract JSON from the reasoning
  if (!text && msg.reasoning_content) {
    console.log("Content empty, checking reasoning...");
    const jsonMatch = msg.reasoning_content.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {}
    }
  }

  console.log("AI content:", text);

  // Strip markdown fences if present
  let cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  // Try parsing the whole thing first
  try { return JSON.parse(cleaned); } catch {}

  // Extract first JSON object with balanced braces
  const start = cleaned.indexOf("{");
  if (start === -1) throw new Error(`AI returned no JSON. Response: ${cleaned.slice(0, 200)}`);

  let depth = 0;
  for (let i = start; i < cleaned.length; i++) {
    if (cleaned[i] === "{") depth++;
    if (cleaned[i] === "}") depth--;
    if (depth === 0) {
      return JSON.parse(cleaned.slice(start, i + 1));
    }
  }

  throw new Error("AI returned incomplete JSON");
}

// --- Search via npm registry (api.github.com is blocked, npm works) ---
async function searchNpm(query, topic) {
  const searchQuery = `${query} ${topic}`;
  const url = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(searchQuery)}&size=10&popularity=1.0&quality=0.0`;

  console.log(`npm search: ${searchQuery}`);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "VibeMatch/1.0" },
    });

    if (!res.ok) {
      console.error(`npm search returned ${res.status}`);
      return [];
    }

    const data = await res.json();
    const repos = (data.objects || []).map((obj) => {
      const pkg = obj.package;
      const repoUrl = pkg.links?.repository || pkg.links?.homepage || "";
      // Extract GitHub owner/repo from URL
      const ghMatch = repoUrl.match(/github\.com\/([\w.-]+\/[\w.-]+)/);
      const fullName = ghMatch ? ghMatch[1] : `npm/${pkg.name}`;

      return {
        name: pkg.name,
        full_name: fullName,
        description: pkg.description || "",
        url: ghMatch ? `https://github.com/${fullName}` : `https://www.npmjs.com/package/${pkg.name}`,
        popularity: Math.round((obj.score?.detail?.popularity || 0) * 100),
        weeklyDownloads: obj.package?.downloads || 0,
        topics: [topic],
        updated_at: pkg.date || "",
        owner: fullName.split("/")[0],
      };
    });

    console.log(`  → ${repos.length} packages found`);
    return repos;
  } catch (err) {
    console.error(`npm search error: ${err.message}`);
    return [];
  }
}

// --- Main search endpoint ---
app.get("/api/search", async (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  if (!checkRate(ip)) {
    return res.status(429).json({ error: "Rate limit exceeded. Try again in a minute." });
  }

  const query = sanitizeQuery(req.query.q || "");
  if (!query) return res.status(400).json({ error: "Missing query parameter ?q=" });
  if (query.length > MAX_QUERY_LENGTH) return res.status(400).json({ error: "Query too long" });

  if (!VIBE_PROXY || !VIBE_KEY) {
    return res.status(500).json({ error: "VIBE_PROXY and VIBE_KEY not set on server." });
  }

  // Check cache
  const cached = getCached(query);
  if (cached) return res.json(cached);

  try {
    // Step 1: AI analyzes the project idea
    const analysis = await askAI(query);

    // Step 2: Search npm registry in parallel for each tool type (fail gracefully)
    const safe = (fn) => fn.catch((e) => { console.error("Search failed:", e.message); return []; });
    const mcpPromises = (analysis.mcp_queries || []).map((q) => safe(searchNpm(q, "mcp")));
    const skillPromises = (analysis.skill_queries || []).map((q) => safe(searchNpm(q, "skill")));
    const agentPromises = (analysis.agent_queries || []).map((q) => safe(searchNpm(q, "agent")));

    const [mcpResults, skillResults, agentResults] = await Promise.all([
      Promise.all(mcpPromises),
      Promise.all(skillPromises),
      Promise.all(agentPromises),
    ]);

    // Flatten and deduplicate by full_name
    const dedupe = (arr) => {
      const seen = new Set();
      return arr
        .flat()
        .filter((r) => {
          if (seen.has(r.full_name)) return false;
          seen.add(r.full_name);
          return true;
        })
        .sort((a, b) => b.stars - a.stars)
        .slice(0, 10);
    };

    const result = {
      query,
      analysis: {
        capabilities: analysis.capabilities || [],
        reasoning: analysis.reasoning || {},
      },
      results: {
        mcps: dedupe(mcpResults),
        skills: dedupe(skillResults),
        agents: dedupe(agentResults),
      },
    };

    setCache(query, result);
    res.json(result);
  } catch (err) {
    console.error("Search error:", err.message);
    res.status(500).json({ error: "Search failed. Please try again." });
  }
});

app.listen(PORT, () => {
  console.log(`VibeMatch running on http://localhost:${PORT}`);
});
