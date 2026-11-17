# Giftea

A personal web app that helps you figure out what to gift the people in your life.

It has two layouts, and people switch between them with the **Chat / Classic** toggle at the top of the home page (remembered in the browser):

- **Chat** (the default): Giftea asks one question at a time, mostly with tap-to-answer chips, and shows gift ideas right in the conversation. You can also type everything at once ("my sister Ama, into pottery, hates clutter") and it skips what you've already said. Tweak chips (cheaper, more personal, an experience, surprise me) get fresh ideas without starting over. Whoever you chat about is saved to your people.
- **Classic**: the friends list, profiles, quiz and ideas pages below.

Both layouts share the same saved friends.

- **Your people**: friends sorted by their next occasion.
- **Spill the tea**: fun questions about a friend, one at a time, to build their profile.
- **Gift ideas**: three AI ideas (from Claude or OpenAI) for any occasion, grounded in what you've shared and what you've given before.

Everything you add is stored in your browser only (localStorage). There's no account and no database.

## Run it

```bash
npm install
echo "OPENAI_API_KEY=your-key" > .env.local   # or ANTHROPIC_API_KEY
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

Keys are only read on the server (`app/api/*`), so they never reach the browser.

## Where things live

| Path | What |
| --- | --- |
| `app/page.tsx` | Home: shows Chat or Classic (the friends list) |
| `components/chat.tsx` | The chat screen: bubbles, chips, idea cards, side panel |
| `lib/chat-script.ts` | What the chat says and asks, in order. Edit the wording here |
| `lib/layout.ts`, `components/layout-switch.tsx` | The Chat / Classic choice |
| `app/friend/[id]/page.tsx` | Friend profile: countdown, occasions, things they love, gift history, shortlist |
| `app/friend/[id]/tea/page.tsx` | "Spill the tea" questions |
| `app/friend/[id]/ideas/page.tsx` | Gift ideas |
| `app/api/ideas/route.ts` | Returns `{ ideas: [{ title, why, isTopPick }] }` |
| `app/api/understand/route.ts` | Reads a typed description into name, relationship, likes and notes (chat only) |
| `lib/ai/provider.ts` | Picks Claude or OpenAI from your keys |
| `lib/ai/prompt.ts` | The shared prompt, request and response schemas |
| `lib/ai/claude.ts`, `lib/ai/openai.ts` | One small file per provider |
| `lib/questions.ts` | The question bank (20 questions) |
| `lib/occasions.ts` | Occasion presets and countdown maths |
| `lib/currency.ts` | Currency from the browser locale, budget presets |
| `lib/store.ts` | localStorage store |
