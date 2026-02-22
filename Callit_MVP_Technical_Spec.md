# CALLIT — Prediction Market MVP
## Technical Specification
### Delora Labs | February 2026
### "Call it. Trade it. Prove it."

---

## 1. Executive Summary

| Parameter | Value |
|-----------|-------|
| Project Name | Callit (callit.io) |
| Target Market | Global (Curaçao/Malta licensed), initial focus Serbia & Balkans |
| Tech Stack | Node.js/TypeScript, Next.js, PostgreSQL, Redis |
| Team Size Needed | 3-4 engineers (from existing Delora Labs team) |
| MVP Timeline | 8-10 weeks |
| Estimated Dev Cost | €15,000-25,000 (internal team time) |
| Infrastructure Cost | ~€200-400/month |

Callit ("Call it") is a prediction market exchange where users trade on the outcomes of real-world events — sports, politics, crypto, economy, entertainment. Licensed offshore (Curaçao initially, Malta upgrade planned), fiat-friendly with crypto support, designed for global reach with initial user acquisition focused on Serbia and the Balkans.

---

## 2. MVP Scope — What's IN, What's OUT

### IN (Must Have for MVP)
- Binary prediction markets (YES/NO outcomes)
- User registration & login (email + social)
- Deposit via crypto (USDC/USDT) + e-wallets (Skrill, Jeton)
- Simple order matching (limit orders + market orders)
- Real-time price updates via WebSocket
- Manual market creation (admin panel)
- Manual market resolution (admin panel)
- User portfolio / balance tracking
- Basic mobile-responsive web UI
- 3-5 market categories: Sports, Politics, Crypto, Entertainment, Economy

### OUT (Post-MVP / V2)
- Native mobile apps (iOS/Android)
- Fiat bank card payments (requires PSP integration + license)
- Automated market resolution via oracle/API feeds
- AMM (Automated Market Maker) — start with order book only
- Social features (comments, leaderboards, profiles)
- API for third-party integrations
- Multi-language (start with English, add Serbian/regional later)
- Advanced analytics dashboard
- Affiliate system
- KYC/AML automation (manual review for MVP)

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│                    FRONTEND                      │
│          Next.js 14+ (App Router)                │
│     React + Tailwind CSS + shadcn/ui             │
│          WebSocket client for live data           │
└──────────────────────┬──────────────────────────┘
                       │ HTTPS / WSS
                       ▼
┌─────────────────────────────────────────────────┐
│                  API GATEWAY                     │
│              Nginx (reverse proxy)               │
│           Rate limiting, SSL termination          │
└──────────────────────┬──────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│   REST API   │ │ WebSocket│ │  Admin API   │
│  (Express/   │ │  Server  │ │  (separate   │
│   Fastify)   │ │  (ws)    │ │   routes)    │
└──────┬───────┘ └────┬─────┘ └──────┬───────┘
       │              │              │
       └──────────────┼──────────────┘
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
   ┌────────────┐ ┌────────┐ ┌────────────┐
   │ PostgreSQL │ │ Redis  │ │  Bull MQ   │
   │  (primary  │ │(cache, │ │  (job      │
   │   data)    │ │ pub/sub│ │  queue)    │
   └────────────┘ └────────┘ └────────────┘
```

### 3.2 Core Services (Monolith for MVP)

For MVP, everything runs as a single Node.js application with logical separation. No microservices — that's premature optimization.

| Service | Responsibility |
|---------|---------------|
| AuthService | Registration, login, JWT tokens, session management |
| UserService | User profiles, balances, KYC status |
| MarketService | Market CRUD, lifecycle management, categories |
| OrderService | Order placement, matching engine, position management |
| WalletService | Deposits, withdrawals, balance mutations, transaction log |
| SettlementService | Market resolution, payout calculation, distribution |
| NotificationService | Email notifications, WebSocket push |
| AdminService | Market creation, resolution, user management, KYC review |

---

## 4. Database Schema (PostgreSQL)

### 4.1 Core Tables

```sql
-- Users
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255),
  display_name    VARCHAR(100),
  auth_provider   VARCHAR(20) DEFAULT 'email', -- email, google, apple
  kyc_status      VARCHAR(20) DEFAULT 'none',  -- none, pending, verified, rejected
  kyc_data        JSONB,
  is_admin        BOOLEAN DEFAULT false,
  balance         DECIMAL(18,2) DEFAULT 0.00,  -- RSD or EUR balance
  frozen_balance  DECIMAL(18,2) DEFAULT 0.00,  -- in active orders
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Markets
CREATE TABLE markets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            VARCHAR(255) UNIQUE NOT NULL,
  title           VARCHAR(500) NOT NULL,
  description     TEXT,
  category        VARCHAR(50) NOT NULL,       -- sports, politics, crypto, economy, entertainment
  image_url       VARCHAR(500),
  
  status          VARCHAR(20) DEFAULT 'draft', -- draft, open, closed, resolved, cancelled
  resolution      VARCHAR(10),                 -- yes, no, null (cancelled)
  
  yes_price       DECIMAL(4,2) DEFAULT 0.50,  -- current YES price (0.01-0.99)
  no_price        DECIMAL(4,2) DEFAULT 0.50,  -- always 1 - yes_price
  
  total_volume    DECIMAL(18,2) DEFAULT 0.00,
  total_yes_shares DECIMAL(18,2) DEFAULT 0.00,
  total_no_shares  DECIMAL(18,2) DEFAULT 0.00,
  
  open_at         TIMESTAMPTZ,
  close_at        TIMESTAMPTZ NOT NULL,        -- when trading stops
  resolve_at      TIMESTAMPTZ,                 -- when result is known
  
  resolution_source VARCHAR(500),              -- URL or description of truth source
  resolved_by     UUID REFERENCES users(id),
  resolved_at_actual TIMESTAMPTZ,
  
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_markets_status ON markets(status);
CREATE INDEX idx_markets_category ON markets(category);
CREATE INDEX idx_markets_close_at ON markets(close_at);

-- Orders (the order book)
CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  market_id       UUID NOT NULL REFERENCES markets(id),
  
  side            VARCHAR(3) NOT NULL,         -- yes, no
  type            VARCHAR(10) NOT NULL,        -- limit, market
  
  price           DECIMAL(4,2),                -- limit price (0.01-0.99)
  quantity         DECIMAL(18,2) NOT NULL,      -- number of shares
  filled_quantity  DECIMAL(18,2) DEFAULT 0.00,
  remaining_qty    DECIMAL(18,2),
  
  status          VARCHAR(20) DEFAULT 'open',  -- open, filled, partial, cancelled
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_market ON orders(market_id, status);
CREATE INDEX idx_orders_user ON orders(user_id, status);
CREATE INDEX idx_orders_matching ON orders(market_id, side, price, created_at) 
  WHERE status IN ('open', 'partial');

-- Trades (matched orders)
CREATE TABLE trades (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id       UUID NOT NULL REFERENCES markets(id),
  buy_order_id    UUID NOT NULL REFERENCES orders(id),
  sell_order_id   UUID NOT NULL REFERENCES orders(id),
  buyer_id        UUID NOT NULL REFERENCES users(id),
  seller_id       UUID NOT NULL REFERENCES users(id),
  
  side            VARCHAR(3) NOT NULL,         -- yes, no
  price           DECIMAL(4,2) NOT NULL,
  quantity         DECIMAL(18,2) NOT NULL,
  
  fee_buyer       DECIMAL(18,4) DEFAULT 0,
  fee_seller      DECIMAL(18,4) DEFAULT 0,
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trades_market ON trades(market_id, created_at);

-- Positions (user holdings per market)
CREATE TABLE positions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  market_id       UUID NOT NULL REFERENCES markets(id),
  
  yes_shares      DECIMAL(18,2) DEFAULT 0.00,
  no_shares       DECIMAL(18,2) DEFAULT 0.00,
  avg_yes_price   DECIMAL(4,2),
  avg_no_price    DECIMAL(4,2),
  
  realized_pnl    DECIMAL(18,2) DEFAULT 0.00,
  
  UNIQUE(user_id, market_id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions (money movement ledger)
CREATE TABLE transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  
  type            VARCHAR(20) NOT NULL,        -- deposit, withdrawal, trade_buy, trade_sell, 
                                               -- payout, fee, refund
  amount          DECIMAL(18,2) NOT NULL,      -- positive = credit, negative = debit
  balance_after   DECIMAL(18,2) NOT NULL,
  
  reference_type  VARCHAR(20),                 -- order, trade, market, external
  reference_id    UUID,
  
  payment_method  VARCHAR(30),                 -- crypto_usdt, crypto_usdc, skrill, jeton, manual
  external_tx_id  VARCHAR(255),                -- external payment reference
  
  status          VARCHAR(20) DEFAULT 'completed', -- pending, completed, failed
  metadata        JSONB,
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user ON transactions(user_id, created_at);

-- Price history (for charts)
CREATE TABLE price_history (
  id              BIGSERIAL PRIMARY KEY,
  market_id       UUID NOT NULL REFERENCES markets(id),
  yes_price       DECIMAL(4,2) NOT NULL,
  volume          DECIMAL(18,2) DEFAULT 0,
  timestamp       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_price_history ON price_history(market_id, timestamp);
```

### 4.2 Redis Data Structures

```
# Live order book (sorted sets)
orderbook:{market_id}:yes:bids    → ZSET (price → order_id)
orderbook:{market_id}:yes:asks    → ZSET (price → order_id)
orderbook:{market_id}:no:bids     → ZSET (price → order_id)
orderbook:{market_id}:no:asks     → ZSET (price → order_id)

# Current prices (hash)
prices:{market_id}                → HASH { yes_price, no_price, volume_24h, last_trade }

# User sessions
session:{session_id}              → HASH { user_id, email, ... }

# Rate limiting
ratelimit:{ip}:{endpoint}         → STRING (counter with TTL)

# WebSocket pub/sub channels
ws:market:{market_id}             → PUB/SUB (price updates, new trades)
ws:user:{user_id}                 → PUB/SUB (order fills, balance changes)
```

---

## 5. Matching Engine (Core Algorithm)

This is the heart of the platform. For MVP, implement a simple price-time priority CLOB.

### 5.1 Order Matching Logic (Pseudocode)

```typescript
async function placeOrder(order: NewOrder): Promise<OrderResult> {
  // 1. Validate
  if (order.price < 0.01 || order.price > 0.99) throw new Error('Invalid price');
  if (market.status !== 'open') throw new Error('Market closed');
  
  // 2. Calculate cost and freeze funds
  const cost = order.quantity * order.price;
  if (user.balance < cost) throw new Error('Insufficient balance');
  await freezeBalance(user.id, cost);
  
  // 3. Try to match against existing orders
  const oppositeBook = getOppositeBook(order);
  // For YES buy at 0.60, match against NO buy at <= 0.40
  // (because YES@0.60 + NO@0.40 = 1.00)
  
  let remainingQty = order.quantity;
  const fills = [];
  
  while (remainingQty > 0) {
    const bestOpposite = oppositeBook.peek(); // best price, oldest first
    if (!bestOpposite) break;
    
    // Check if prices cross
    // YES buy @ 0.60 matches with NO buy @ <= 0.40
    if (order.side === 'yes' && bestOpposite.price > (1 - order.price)) break;
    if (order.side === 'no' && bestOpposite.price > (1 - order.price)) break;
    
    const fillQty = Math.min(remainingQty, bestOpposite.remaining_qty);
    const fillPrice = order.price; // taker gets maker's price advantage
    
    fills.push({ opposite: bestOpposite, qty: fillQty, price: fillPrice });
    remainingQty -= fillQty;
    bestOpposite.remaining_qty -= fillQty;
    
    if (bestOpposite.remaining_qty === 0) oppositeBook.remove(bestOpposite);
  }
  
  // 4. Execute fills (in a DB transaction)
  await db.transaction(async (tx) => {
    for (const fill of fills) {
      await createTrade(tx, order, fill);
      await updatePositions(tx, order.user_id, fill.opposite.user_id, fill);
      await settleBalances(tx, order, fill);
    }
    
    if (remainingQty > 0 && order.type === 'limit') {
      await addToOrderBook(tx, { ...order, remaining_qty: remainingQty });
    } else {
      await unfreezeBalance(user.id, remainingQty * order.price);
    }
    
    await updateMarketPrice(tx, order.market_id);
  });
  
  // 5. Broadcast price update via WebSocket
  broadcastPriceUpdate(order.market_id);
  
  return { fills, remainingQty, orderId: order.id };
}
```

### 5.2 Key Matching Rules

1. YES price + NO price always sums to 1.00 (e.g., YES@0.65 means NO@0.35)
2. A YES buy at 0.60 matches with a NO buy at 0.40 or lower
3. Price-time priority: best price first, then oldest order first
4. Market orders execute immediately at best available price
5. Limit orders rest in the book if not fully matched
6. All balance mutations happen inside a single PostgreSQL transaction (ACID)

---

## 6. API Design (REST + WebSocket)

### 6.1 REST Endpoints

```
AUTH
  POST   /api/auth/register          { email, password, displayName }
  POST   /api/auth/login             { email, password }
  POST   /api/auth/login/google      { token }
  POST   /api/auth/refresh           { refreshToken }
  POST   /api/auth/logout
  POST   /api/auth/forgot-password   { email }

MARKETS
  GET    /api/markets                 ?category=&status=&sort=&page=&limit=
  GET    /api/markets/:slug           Full market details + order book snapshot
  GET    /api/markets/:id/trades      Recent trades
  GET    /api/markets/:id/history     Price history (for charts)
  GET    /api/markets/:id/orderbook   Current order book depth

ORDERS
  POST   /api/orders                  { marketId, side, type, price, quantity }
  GET    /api/orders                  ?status=open (user's orders)
  DELETE /api/orders/:id              Cancel open order

PORTFOLIO
  GET    /api/portfolio               User positions across all markets
  GET    /api/portfolio/:marketId     Position in specific market

WALLET
  GET    /api/wallet/balance          Current balance + frozen
  GET    /api/wallet/transactions     Transaction history
  POST   /api/wallet/deposit          Initiate deposit (returns payment info)
  POST   /api/wallet/withdraw         Initiate withdrawal

USER
  GET    /api/user/profile
  PUT    /api/user/profile
  POST   /api/user/kyc               Upload KYC documents

ADMIN (protected)
  POST   /api/admin/markets           Create market
  PUT    /api/admin/markets/:id       Edit market
  POST   /api/admin/markets/:id/resolve  { resolution: 'yes'|'no' }
  GET    /api/admin/users             User list
  PUT    /api/admin/users/:id/kyc     Approve/reject KYC
  GET    /api/admin/deposits          Pending deposits
  POST   /api/admin/deposits/:id/approve  Manual deposit approval
```

### 6.2 WebSocket Events

```typescript
// Client subscribes to channels
ws.send({ type: 'subscribe', channels: ['market:abc123', 'user:myUserId'] });

// Server pushes events:

// Market price update (to all subscribers of that market)
{ type: 'price_update', market_id: 'abc123', yes_price: 0.65, no_price: 0.35, volume_24h: 15000 }

// New trade happened
{ type: 'new_trade', market_id: 'abc123', price: 0.65, quantity: 100, side: 'yes', timestamp: '...' }

// Order book depth change
{ type: 'orderbook_update', market_id: 'abc123', bids: [...], asks: [...] }

// User-specific: order filled
{ type: 'order_filled', order_id: '...', filled_qty: 50, fill_price: 0.65 }

// User-specific: balance changed
{ type: 'balance_update', balance: 5000.00, frozen: 1200.00 }

// Market resolved
{ type: 'market_resolved', market_id: 'abc123', resolution: 'yes' }
```

---

## 7. Frontend Specification

### 7.1 Tech Stack
- Next.js 14+ (App Router, Server Components where possible)
- React 18+
- Tailwind CSS + shadcn/ui components
- Lightweight Charting Library (lightweight-charts by TradingView — free, perfect for price charts)
- Zustand for client state management
- React Query (TanStack Query) for server state
- WebSocket via native browser API + reconnection logic

### 7.2 Pages & Components

```
/                          → Homepage (featured markets, categories, trending)
/markets                   → Market browser (filterable by category, search)
/market/[slug]             → Market detail page (THE key page)
  ├── Price chart (lightweight-charts)
  ├── Order book visualization (depth chart)
  ├── Trade panel (buy YES / buy NO)
  ├── Recent trades list
  ├── Market description & resolution criteria
  └── Related markets
/portfolio                 → User's positions, open orders, P&L
/wallet                    → Balance, deposit, withdraw, transaction history
/profile                   → Account settings, KYC upload
/auth/login                → Login page
/auth/register             → Registration page
/admin                     → Admin dashboard (protected)
  ├── /admin/markets       → Create/edit/resolve markets
  ├── /admin/users         → User management, KYC review
  └── /admin/deposits      → Deposit approval queue
```

### 7.3 Market Detail Page — The Core UX

This is the most important page. It should feel like a trading interface, not a betting slip.

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back   [Sports]  Will Partizan win the 2025/26 Superliga?     │
│           Volume: €15,432   Closes: Mar 15, 2026   |  CALLIT    │
├───────────────────────────────────┬─────────────────────────────┤
│                                   │                             │
│   ┌─────────────────────────┐     │   ┌─ TRADE PANEL ────────┐ │
│   │                         │     │   │                       │ │
│   │    PRICE CHART           │     │   │  [YES 0.65]  [NO 0.35]│ │
│   │    (lightweight-charts)  │     │   │                       │ │
│   │                         │     │   │  Amount: [____] EUR    │ │
│   │    Shows YES price       │     │   │                       │ │
│   │    over time             │     │   │  Potential payout:     │ │
│   │                         │     │   │  €153.85               │ │
│   └─────────────────────────┘     │   │                       │ │
│                                   │   │  [  BUY YES  ]        │ │
│   ┌─────────────────────────┐     │   │  [  BUY NO   ]        │ │
│   │  ORDER BOOK (optional)   │     │   │                       │ │
│   │  YES bids | NO bids      │     │   │  Limit price: [0.65]  │ │
│   └─────────────────────────┘     │   │  [Limit] [Market]     │ │
│                                   │   └───────────────────────┘ │
│   ┌─────────────────────────┐     │                             │
│   │  RECENT TRADES           │     │   ┌─ YOUR POSITION ─────┐ │
│   │  0.65  100  2m ago       │     │   │ YES: 50 shares @0.60 │ │
│   │  0.64  250  5m ago       │     │   │ P&L: +€2.50 (+8.3%)  │ │
│   │  0.63  80   12m ago      │     │   │ [SELL]                │ │
│   └─────────────────────────┘     │   └───────────────────────┘ │
├───────────────────────────────────┴─────────────────────────────┤
│  RESOLUTION CRITERIA                                            │
│  Resolves YES if Partizan finishes 1st in Superliga 2025/26    │
│  season. Source: Official FK Partizan and FSS results.           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Payment Integration (MVP)

### 8.1 Deposit Methods for MVP

| Method | Integration | Speed | Min Deposit |
|--------|------------|-------|-------------|
| USDT (TRC-20) | Generate wallet per user via Tron API | ~3 min | $10 |
| USDC (Polygon) | Generate wallet via ethers.js | ~30 sec | $10 |
| Skrill | Skrill Quick Checkout API | Instant | €10 |
| Jeton | Jeton Wallet API | Instant | €10 |
| Manual crypto | User sends to master wallet, admin confirms | 1-24h | $10 |

### 8.2 Deposit Flow (Crypto — Simplest for MVP)

```
1. User clicks "Deposit"
2. System shows a unique deposit address (pre-generated per user)
   - For USDT TRC-20: unique Tron address
   - For USDC Polygon: unique Polygon address
3. User sends crypto from any wallet/exchange
4. Backend monitors blockchain for incoming transactions
   - Bull MQ job polls every 30 seconds
   - After 3 confirmations → credit user balance
5. Balance updated, WebSocket notification sent
6. Transaction logged in transactions table
```

### 8.3 Internal Currency

MVP operates in EUR (displayed to user). Crypto deposits are auto-converted at market rate at time of deposit. All internal accounting is in EUR to keep it simple.

---

## 9. Settlement & Payouts

### 9.1 Market Resolution Flow

```
1. Event occurs (e.g., Partizan wins the league)
2. Admin opens admin panel → Markets → Select market
3. Admin sets resolution = "YES" and provides source URL
4. System triggers SettlementService:
   a. Mark market status = 'resolved'
   b. For each position:
      - If user holds YES shares and resolution = YES:
        payout = yes_shares × 1.00 (full value)
      - If user holds NO shares and resolution = YES:
        payout = 0.00 (worthless)
      - Vice versa for NO resolution
   c. Credit payouts to user balances
   d. Create transaction records
   e. Broadcast resolution via WebSocket
5. Users see updated balances immediately
```

### 9.2 Withdrawal Flow

```
1. User requests withdrawal (amount, method, destination)
2. System validates: balance >= amount, KYC verified
3. Creates pending withdrawal record
4. Admin reviews and approves in admin panel
5. Admin sends crypto manually (MVP) or triggers Skrill API
6. Admin marks withdrawal as completed
7. User balance deducted, transaction logged
```

---

## 10. Security Considerations

### 10.1 MVP Security Checklist

- JWT tokens with short expiry (15 min access, 7 day refresh)
- bcrypt password hashing (cost factor 12)
- Rate limiting on all endpoints (express-rate-limit)
- CORS configuration (allowed origins only)
- SQL injection prevention (parameterized queries via ORM)
- XSS prevention (React handles by default + CSP headers)
- HTTPS everywhere (Let's Encrypt)
- Input validation on all endpoints (Zod schemas)
- Admin routes behind separate auth middleware
- All balance mutations inside DB transactions
- Idempotency keys on order placement
- Double-entry bookkeeping (every debit has a credit)

### 10.2 Critical: Balance Integrity

The #1 risk in a prediction market is balance manipulation. Every balance change MUST:
1. Happen inside a PostgreSQL transaction with row-level locking
2. Use SELECT FOR UPDATE on the user row
3. Check balance >= amount INSIDE the transaction
4. Log a transaction record with balance_after for audit trail

---

## 11. Infrastructure & DevOps

### 11.1 MVP Deployment

```
Single VPS (Hetzner CPX31 — €15/month, 4 vCPU, 8GB RAM)
├── Docker Compose
│   ├── app (Node.js — API + WebSocket + Admin)
│   ├── postgres (PostgreSQL 16)
│   ├── redis (Redis 7)
│   ├── nginx (reverse proxy + SSL)
│   └── bullboard (job queue dashboard)
├── Domain: callit.io
├── SSL: Let's Encrypt via Certbot
└── Backups: Daily PostgreSQL dump to S3-compatible storage
```

### 11.2 Monitoring (MVP)

- Uptime: UptimeRobot (free)
- Logs: Docker logs + simple log rotation
- Errors: Sentry (free tier)
- Metrics: Basic health endpoint + manual checks
- Database: pg_stat_statements for
## 12. Project Timeline (8-10 Weeks)

### Week 1-2: Foundation
- Project setup (monorepo, TypeScript, ESLint, Prettier)
- Database schema creation + migrations (Prisma or Drizzle ORM)
- Auth system (register, login, JWT, Google OAuth)
- Basic user model + wallet/balance logic
- Redis setup + session management

### Week 3-4: Core Trading Engine
- Market CRUD (admin creates markets)
- Order placement API + validation
- Matching engine implementation
- Position tracking
- Transaction ledger
- Unit tests for matching engine (CRITICAL — test edge cases)

### Week 5-6: Frontend
- Next.js project setup + Tailwind + shadcn
- Homepage with market cards
- Market detail page with trade panel
- Price chart integration (lightweight-charts)
- Order book display
- Portfolio page
- Wallet page (balance + transaction history)
- WebSocket integration for live prices

### Week 7-8: Payments & Admin
- Crypto deposit flow (generate addresses, monitor blockchain)
- Skrill/Jeton integration (or manual deposit for true MVP)
- Admin panel (create market, resolve market, approve deposits)
- Withdrawal flow (manual for MVP)
- KYC upload flow (manual review)

### Week 9-10: Polish & Launch
- Mobile responsive fixes
- Error handling + edge cases
- Security audit (rate limiting, input validation, CORS)
- Load testing (basic — can it handle 100 concurrent users?)
- Deployment to production VPS
- DNS + SSL setup
- Seed 5-10 initial markets
- Soft launch to 50-100 beta users

---

## 13. Key Technical Decisions & Rationale

| Decision | Choice | Why |
|----------|--------|-----|
| Monolith vs Microservices | Monolith | 3-4 person team, speed over scalability |
| ORM | Prisma or Drizzle | Type-safe, migrations, your team knows it |
| Order matching | In-process (not separate service) | Simplicity; move to separate process at 1000+ TPS |
| State management | Zustand + React Query | Lightweight, no Redux boilerplate |
| Charts | TradingView Lightweight Charts | Free, fast, looks professional, 30KB |
| Payments | Crypto + e-wallets first | No PSP license needed, global, instant |
| Real-time | Native WebSocket (ws library) | No Socket.io overhead, cleaner protocol |
| Admin panel | Custom (same Next.js app, /admin routes) | No need for separate admin framework for MVP |
| Hosting | Single Hetzner VPS | €15/month, Falkenstein DC close to Serbia, fast |
| Queue | BullMQ | Redis-based, handles deposit monitoring, emails |

---

## 14. What to Build After MVP (V2 Roadmap)

### Priority 1 (Month 3-4)
- Card payments via PSP (once license is obtained)
- Automated market resolution via API feeds (Sportradar for sports)
- Native mobile app (React Native — shared logic with web)
- User leaderboard + public profiles
- Comments/discussion on markets

### Priority 2 (Month 5-6)
- AMM (Automated Market Maker) for markets with low liquidity
- Liquidity rewards program
- REST API for third-party developers
- Affiliate/referral system
- Multi-language (Serbian, Croatian, Bosnian, Spanish, Portuguese)

### Priority 3 (Month 7-12)
- Market creation by users (community markets)
- Advanced order types (stop-loss, conditional orders)
- Mobile push notifications
- Media partnerships (sell prediction data to B92, N1)
- Balkan expansion (Montenegro, Bosnia, North Macedonia)

---

## 15. Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Matching engine bugs | Extensive unit tests, testnet period with fake money first |
| Balance discrepancies | Double-entry ledger, daily reconciliation script, audit log |
| Low liquidity (no trades) | Seed markets yourself as market maker with house funds |
| Regulatory action | Offshore entity, domain rotation plan, legal counsel |
| Payment processor drops you | Multiple payment options, crypto as fallback |
| DDoS attack | Cloudflare free tier, rate limiting, nginx config |
| Database corruption | Daily automated backups, test restore monthly |
| Key person risk | Document everything, code reviews, no single dev owns critical path |

---

## 16. Success Metrics for MVP

| Metric | Target (3 months) |
|--------|-------------------|
| Registered users | 500+ |
| Monthly active users | 100+ |
| Active markets | 15-30 at any time |
| Monthly trading volume | €10,000+ |
| Avg trades per day | 50+ |
| User retention (30-day) | 20%+ |
| Uptime | 99%+ |
| Avg page load time | <2 seconds |
| Critical bugs in production | 0 |

---

## Appendix A: Example Market Configurations

```json
[
  {
    "title": "Will Crvena Zvezda win ABA League 2025/26?",
    "category": "sports",
    "close_at": "2026-06-01T00:00:00Z",
    "resolution_source": "Official ABA League results — abaleague.com",
    "initial_yes_price": 0.55
  },
  {
    "title": "Will EUR/RSD cross 120.00 by July 2026?",
    "category": "economy",
    "close_at": "2026-07-01T00:00:00Z",
    "resolution_source": "NBS official middle exchange rate on July 1, 2026",
    "initial_yes_price": 0.15
  },
  {
    "title": "Will Serbia open a new EU accession chapter by end of 2026?",
    "category": "politics",
    "close_at": "2026-12-31T00:00:00Z",
    "resolution_source": "Official EU Delegation statement",
    "initial_yes_price": 0.20
  },
  {
    "title": "Will Bitcoin cross $150,000 by May 1, 2026?",
    "category": "crypto",
    "close_at": "2026-05-01T00:00:00Z",
    "resolution_source": "CoinGecko BTC/USD cena u 00:00 UTC",
    "initial_yes_price": 0.35
  },
  {
    "title": "Who will headline EXIT Festival 2026?",
    "category": "entertainment",
    "close_at": "2026-07-01T00:00:00Z",
    "resolution_source": "Official EXIT Festival website — exitfest.org",
    "initial_yes_price": 0.50
  }
]
```

## Appendix B: Minimal package.json Dependencies

```json
{
  "dependencies": {
    "next": "^14.2",
    "react": "^18.3",
    "fastify": "^4.28",
    "@fastify/websocket": "^10.0",
    "@fastify/cors": "^9.0",
    "@fastify/rate-limit": "^9.1",
    "prisma": "^5.19",
    "@prisma/client": "^5.19",
    "ioredis": "^5.4",
    "bullmq": "^5.12",
    "jsonwebtoken": "^9.0",
    "bcrypt": "^5.1",
    "zod": "^3.23",
    "zustand": "^4.5",
    "@tanstack/react-query": "^5.56",
    "lightweight-charts": "^4.2",
    "ethers": "^6.13",
    "tronweb": "^6.0",
    "decimal.js": "^10.4",
    "date-fns": "^3.6"
  },
  "devDependencies": {
    "typescript": "^5.5",
    "vitest": "^2.0",
    "@types/node": "^22",
    "tailwindcss": "^3.4",
    "eslint": "^9"
  }
}
```
