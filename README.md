# DeckForge

A professional Yu-Gi-Oh! deck building and testing platform.

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS** (dark mode, custom design system)
- **PostgreSQL** via **Prisma**
- **NextAuth v4** (credentials-based authentication)
- **YGOPRODeck API** (card data and images)
- **Framer Motion, Recharts, Radix UI**

## Prerequisites

- Node.js 18+
- PostgreSQL (local or cloud)

## Quick Start

### 1. Clone and install

```bash
cd "C:\Programming\DeckForge"
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/deckforge"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"   # generate: openssl rand -base64 32
```

### 3. Create database and push schema

```bash
# Create the database (run in psql or pgAdmin)
# CREATE DATABASE deckforge;

# Push Prisma schema (creates all tables)
npm run db:push

# Optional: open Prisma Studio to browse your data
npm run db:studio
```

### 4. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:push` | Push schema to DB (no migrations) |
| `npm run db:migrate` | Create and run migrations |
| `npm run db:studio` | Open Prisma Studio GUI |

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, Register pages
│   ├── (app)/           # Protected pages (dashboard, deck, profile)
│   ├── api/             # API routes
│   └── page.tsx         # Landing page
├── components/
│   ├── ui/              # Button, Input, Modal, Badge, etc.
│   ├── layout/          # Navbar, AppShell
│   ├── cards/           # CardImage, CardGrid, CardFilters, CardTooltip
│   └── deck/            # DeckZone component
├── hooks/               # useDeck, useHandTest
├── lib/                 # db, auth, ygoprodeck, probability, utils
└── types/               # yugioh.ts
prisma/
└── schema.prisma
```

## Features

- **Deck Builder** — Search 13,000+ cards, filter by type/attribute/level/archetype/banlist, add to main/extra/side deck, import/export deck lists
- **Hand Tester** — Shuffle deck, draw opening hands (5 or 6 cards), draw additional cards, reset
- **Goldfish Mode** — Move cards freely between deck/hand/field/graveyard/banished zones
- **Analytics** — Type ratios, attribute breakdown, level distribution, archetype analysis, full deck statistics
- **Probability Calculator** — Hypergeometric distribution for single-card and multi-piece combo probabilities
- **Authentication** — Register/login/logout with bcrypt-hashed passwords

## Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Manual (Node.js server)

```bash
npm run build
npm start
```

## Adding Cards to Cache

Cards are fetched live from YGOPRODeck API and cached at the Next.js fetch layer (1-hour TTL). No manual seeding needed.

## Future Roadmap

- Public deck sharing and browsing
- Deck ratings and comments
- Collection tracking
- Price tracking via TCGPlayer/Cardmarket
- Tournament report builder
- Meta analysis dashboard
