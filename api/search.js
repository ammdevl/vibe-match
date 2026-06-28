// Vercel serverless function — /api/search
const VIBE_PROXY = process.env.VIBE_PROXY || "";
const VIBE_KEY = process.env.VIBE_KEY || "";
const MAX_QUERY_LENGTH = 500;

// --- Sanitize user input: strip control chars, quotes, truncate ---
function sanitizeQuery(raw) {
  return raw
    .replace(/[\x00-\x1f\x7f]/g, "")
    .replace(/["\\]/g, "")
    .slice(0, MAX_QUERY_LENGTH)
    .trim();
}

// --- Caches ---
const searchCache = new Map();
const starCache = new Map();
const SEARCH_CACHE_TTL = 5 * 60 * 1000;   // 5 min
const STAR_CACHE_TTL = 60 * 60 * 1000;     // 1 hour
const MAX_CACHE_SIZE = 200;

function getCached(map, key, ttl) {
  const entry = map.get(key);
  if (entry && Date.now() - entry.ts < ttl) return entry.data;
  map.delete(key);
  return null;
}

function setCache(map, key, data) {
  if (map.size >= MAX_CACHE_SIZE) {
    const oldest = map.keys().next().value;
    map.delete(oldest);
  }
  map.set(key, { data, ts: Date.now() });
}

// --- Vibe Proxy (OpenAI-compatible API) ---
async function askAI(projectIdea) {
  const system = `You are a JSON API. You MUST respond with ONLY a valid JSON object. No markdown. No code fences. No explanation. Just the raw JSON object.`;

  // User input inside <project> tags to prevent prompt injection.
  // Quotes and backslashes already stripped by sanitizeQuery().
  const user = `Given this project idea, find the MCPs, skills, and agents needed.

<project>
${projectIdea}
</project>

Respond with this exact JSON structure and nothing else:
{"capabilities":["cap1","cap2"],"mcp_queries":["query1"],"skill_queries":["query1"],"agent_queries":["query1"],"reasoning":{"mcp":"why mcp helps","skill":"why skill helps","agent":"why agent helps"}}

mcp_queries: 1-3 short search terms for mcp packages
skill_queries: 1-3 short terms for skill packages
agent_queries: 1-3 short terms for agent packages
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
  const msg = data.choices?.[0]?.message || {};
  const text = msg.content || "";

  // If content is empty, try reasoning
  if (!text && msg.reasoning_content) {
    const jsonMatch = msg.reasoning_content.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      try { return JSON.parse(jsonMatch[0]); } catch {}
    }
  }

  // Strip markdown fences
  let cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  try { return JSON.parse(cleaned); } catch {}

  const start = cleaned.indexOf("{");
  if (start === -1) throw new Error("AI returned no JSON");

  let depth = 0;
  for (let i = start; i < cleaned.length; i++) {
    if (cleaned[i] === "{") depth++;
    if (cleaned[i] === "}") depth--;
    if (depth === 0) return JSON.parse(cleaned.slice(start, i + 1));
  }
  throw new Error("AI returned incomplete JSON");
}

// --- Fetch GitHub stars with cache + timeout ---
async function getGitHubStars(fullName) {
  // Check cache first
  const cached = getCached(starCache, fullName, STAR_CACHE_TTL);
  if (cached !== null) return cached;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3s timeout

    const res = await fetch(`https://api.github.com/repos/${fullName}`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "VibeMatch/1.0",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      setCache(starCache, fullName, null);
      return null;
    }
    const data = await res.json();
    const stars = data.stargazers_count || 0;
    setCache(starCache, fullName, stars);
    return stars;
  } catch {
    setCache(starCache, fullName, null);
    return null;
  }
}

// --- npm registry search + GitHub stars ---
async function searchNpm(query, topic) {
  const searchQuery = `${query} ${topic}`;
  const url = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(searchQuery)}&size=10&popularity=1.0&quality=0.0`;

  try {
    const res = await fetch(url, { headers: { "User-Agent": "VibeMatch/1.0" } });
    if (!res.ok) return [];

    const data = await res.json();

    // Build results from npm
    const results = (data.objects || []).map((obj) => {
      const pkg = obj.package;
      const repoUrl = pkg.links?.repository || pkg.links?.homepage || "";
      const ghMatch = repoUrl.match(/github\.com\/([\w.-]+\/[\w.-]+)/);
      const fullName = ghMatch ? ghMatch[1] : null;

      return {
        name: pkg.name,
        full_name: fullName || `npm/${pkg.name}`,
        description: pkg.description || "",
        url: fullName ? `https://github.com/${fullName}` : `https://www.npmjs.com/package/${pkg.name}`,
        stars: null,
        topics: [topic],
        updated_at: pkg.date || "",
        owner: fullName ? fullName.split("/")[0] : "npm",
      };
    });

    // Fetch GitHub stars in parallel (with 3s timeout each)
    const starPromises = results.map((r) =>
      r.url.includes("github.com")
        ? getGitHubStars(r.full_name).then((s) => { r.stars = s; })
        : Promise.resolve()
    );
    await Promise.all(starPromises);

    return results;
  } catch {
    return [];
  }
}

// --- Format stars for display ---
function formatStars(n) {
  if (n === null || n === undefined) return null;
  return n;
}

// --- Simple in-memory rate limiter for Vercel serverless ---
const RATE_WINDOW = 60 * 1000;
const RATE_MAX = 10;
const rateMap = new Map();

function checkRate(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now - entry.start > RATE_WINDOW) {
    rateMap.set(ip, { count: 1, start: now });
    if (rateMap.size > 1000) { const k = rateMap.keys().next().value; rateMap.delete(k); }
    return true;
  }
  entry.count++;
  return entry.count <= RATE_MAX;
}

// --- Vercel serverless handler ---
module.exports = async function handler(req, res) {
  // Security headers
  res.setHeader("Content-Security-Policy", "default-src 'none'");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Rate limit by IP
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
  if (!checkRate(ip)) {
    return res.status(429).json({ error: "Too many requests. Please wait." });
  }

  const query = sanitizeQuery(req.query.q || "");
  if (!query) return res.status(400).json({ error: "Missing query parameter ?q=" });

  if (!VIBE_PROXY || !VIBE_KEY) {
    return res.status(500).json({ error: "Server misconfigured." });
  }

  const cached = getCached(searchCache, query, SEARCH_CACHE_TTL);
  if (cached) return res.json(cached);

  try {
    const analysis = await askAI(query);
    const safe = (fn) => fn.catch(() => []);

    const [mcpResults, skillResults, agentResults] = await Promise.all([
      Promise.all((analysis.mcp_queries || []).map((q) => safe(searchNpm(q, "mcp")))),
      Promise.all((analysis.skill_queries || []).map((q) => safe(searchNpm(q, "skill")))),
      Promise.all((analysis.agent_queries || []).map((q) => safe(searchNpm(q, "agent")))),
    ]);

    const dedupe = (arr) => {
      const seen = new Set();
      return arr.flat().filter((r) => {
        if (seen.has(r.full_name)) return false;
        seen.add(r.full_name);
        return true;
      }).sort((a, b) => (b.stars || 0) - (a.stars || 0)).slice(0, 10);
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

    setCache(searchCache, query, result);
    return res.json(result);
  } catch (err) {
    console.error("Search error:", err.message);
    return res.status(500).json({ error: "Search failed. Please try again." });
  }
};
