# Giftea

A personal web app that helps you figure out what to gift the people in your life.

- **Your people**: friends sorted by their next occasion.
- **Spill the tea**: fun questions about a friend, one at a time, to build their profile.
- **Gift ideas**: three AI ideas (from Claude or OpenAI) for any occasion, grounded in what you've shared and what you've given before.

Everything you add is stored in your browser only (localStorage). There's no account and no database.

## Run it

```bash
npm install
cp .env.example .env.local   # then paste in an Anthropic or OpenAI API key
npm run dev
```

Open http://localhost:3000.

## AI keys

Giftea works with either provider. Put one key in `.env.local`:

| Key | Uses | Get one at |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Claude Opus 5.5 | https://platform.claude.com |
| `OPENAI_API_KEY` | `gpt-5.5` (change with `OPENAI_MODEL`) | https://platform.openai.com |

If both are set, Claude is used. Add `AI_PROVIDER=openai` to use OpenAI instead. Restart `npm run dev` after editing `.env.local`.

Keys are only read on the server (`app/api/ideas/route.ts`), so they never reach the browser.

## Where things live

| Path | What |
| --- | --- |
| `app/page.tsx` | Your people (friends list) |
| `app/friend/[id]/page.tsx` | Friend profile: countdown, occasions, things they love, gift history, shortlist |
| `app/friend/[id]/tea/page.tsx` | "Spill the tea" questions |
| `app/friend/[id]/ideas/page.tsx` | Gift ideas |
| `app/api/ideas/route.ts` | Picks the provider from your keys and returns `{ ideas: [{ title, why, isTopPick }] }` |
| `lib/ai/prompt.ts` | The shared prompt, request and response schemas |
| `lib/ai/claude.ts`, `lib/ai/openai.ts` | One small file per provider |
| `lib/questions.ts` | The question bank (20 questions) |
| `lib/occasions.ts` | Occasion presets and countdown maths |
| `lib/currency.ts` | Currency from the browser locale, budget presets |
| `lib/store.ts` | localStorage store |
