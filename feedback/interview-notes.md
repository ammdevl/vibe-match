# Interview Notes — Vibe Match

**Interviewer:** @ammdevl
**Date:** 2026-07-07
**Interviewee:** Aung Myint Myat (self-test / developer walkthrough)

---

## Setup

- Tested on: Chrome (desktop), localhost:3000
- Build / deploy status: Working locally, ready for Vercel deployment

---

## Questions & Answers

### Q1: What did you expect before using Vibe Match?

I expected a tool that could analyze project ideas and find the right MCP servers, skills, and AI agents from the npm ecosystem.

### Q2: What worked well?

- The AI-powered natural language analysis accurately identifies project capabilities
- Real npm package results ranked by GitHub stars provide credible recommendations
- Skeleton loading animations make the search feel smooth
- Dark/light mode works seamlessly
- Responsive design works across devices

### Q3: What was confusing or frustrating?

- Initial CORS issues during local development needed patching
- Rate limiting (10 req/min) could be restrictive during testing
- Some npm packages had incomplete metadata

### Q4: Did you accomplish what you wanted?

Yes, the core functionality works as intended. Users can describe their project idea in natural language and get ranked recommendations for MCPs, skills, and agents.

### Q5: What would you improve next?

- Add user authentication to save search history
- Implement package comparison features
- Add more detailed package analytics
- Support for non-npm package registries

### Q6: Any bugs or issues?

- Fixed: CORS policy errors during development
- Fixed: Input validation gaps for edge cases
- Fixed: Logging vulnerabilities in production
- Current: Minor UI tweaks needed for very small screens

---

## Key Takeaways

1. **Strengths:** AI analysis, real npm results, clean UI, responsive
2. **Weaknesses:** Rate limiting, limited package metadata
3. **Next steps:** Add auth, expand package analytics, deploy to production
