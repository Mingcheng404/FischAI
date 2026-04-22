# Fisch Rod Selector

React + Tailwind (dark, gamer-style) dashboard for comparing rods and calculating earnings/profit.

## Data

Edit `public/data.json` to provide:
- `rods`: `id`, `name`, `price`, `luck_multiplier`, `control_rating`, `lure_speed_modifier`, `description`
- `mutations`: `name`, `value_multiplier`, `rarity_tier`, `visual_effect`

## Run

```bash
npm install
npm run dev
```

## AI Chat Configuration

Create `.env.local` (or copy from `.env.example`) and set:

```bash
VITE_PROBEX_API_URL=https://api.probex.top/v1/chat/completions
VITE_PROBEX_MODEL=deepseek-v3
VITE_PROBEX_API_KEY=your_api_key_here
```

Notes:
- The chat only answers Fisch-related questions.
- The prompt is grounded in local `data.json` and `mutations.json`.
- If the API key is missing, the app falls back to local database logic.

