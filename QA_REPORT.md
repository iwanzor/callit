# Callit QA Report

**Date:** 2026-02-22  
**Tester:** Alex (Automated QA)  
**Environment:** https://callit.deloralabs.com

---

## Summary

| Category | Passed | Failed | Total |
|----------|--------|--------|-------|
| Authentication | 6 | 0 | 6 |
| Markets | 5 | 0 | 5 |
| Trading | 4 | 0 | 4 |
| Wallet | 4 | 0 | 4 |
| Admin | 6 | 0 | 6 |
| Localization | 4 | 0 | 4 |
| **TOTAL** | **29** | **0** | **29** |

---

## 1. Authentication Flow

| Test | Status | Details |
|------|--------|---------|
| Login with demo account | ✅ PASS | demo@callit.io / demo123 → Returns accessToken + refreshToken |
| Login with admin account | ✅ PASS | admin@callit.io / admin123 → Returns user with isAdmin=true |
| Registration validation | ✅ PASS | Password validation enforced (uppercase, lowercase, number) |
| Token refresh | ✅ PASS | POST /api/auth/refresh returns new tokens |
| Protected routes without auth | ✅ PASS | Returns 401 "Authentication required" |
| Get current user (/me) | ✅ PASS | Returns user object with balance, kycStatus |

---

## 2. Markets Flow

| Test | Status | Details |
|------|--------|---------|
| List all markets | ✅ PASS | Returns 31 markets with pagination |
| Filter by category (crypto) | ✅ PASS | Returns 4 crypto markets |
| Market detail | ✅ PASS | Returns full market data with orderBook |
| Order book endpoint | ✅ PASS | Returns bids/asks with summary |
| Locale filtering | ✅ PASS | Returns locale-specific + global markets, ordered correctly |

---

## 3. Trading Flow (as demo user)

| Test | Status | Details |
|------|--------|---------|
| Place limit order (YES) | ✅ PASS | Order created, status: open |
| Place market order (YES) | ✅ PASS | Order created, status: open |
| Check order in orderbook | ✅ PASS | Limit order visible at 0.35 price |
| Check positions in portfolio | ✅ PASS | 8 positions with value/P&L data |

---

## 4. Wallet Flow (as demo user)

| Test | Status | Details |
|------|--------|---------|
| Get balance | ✅ PASS | Returns balance, frozenBalance, availableBalance |
| Deposit funds | ✅ PASS | $100 deposited, transaction recorded |
| Withdraw funds | ✅ PASS | $50 withdrawn, balance updated |
| Transaction history | ✅ PASS | All transactions listed with timestamps |

---

## 5. Admin Flow (as admin user)

| Test | Status | Details |
|------|--------|---------|
| Admin stats | ✅ PASS | Returns totalUsers, totalVolume, activeMarkets |
| Users list | ✅ PASS | Returns 2 users with balance info |
| Transactions list | ✅ PASS | All platform transactions visible |
| Non-admin access denied | ✅ PASS | Returns 403 "Admin access required" |
| Create market | ✅ PASS | Market created with initial 50/50 price |
| Resolve market | ✅ PASS | Market resolved to YES, payout calculated |

---

## 6. Localization (Serbian)

| Test | Status | Details |
|------|--------|---------|
| Landing page title (EN) | ✅ PASS | "Callit - Prediction Markets" |
| Landing page title (SR) | ✅ PASS | "Callit - Tržišta predikcija" |
| Markets page (EN/SR) | ✅ PASS | Both return HTTP 200 |
| Serbian markets present | ✅ PASS | Đoković, Zvezda, Partizan markets available |

---

## Bugs Found & Fixed

### Bug 1: Portfolio Page Not Fetching Positions
- **Issue:** Portfolio page showed static "No positions" placeholder instead of fetching real data
- **File:** `src/app/[locale]/(dashboard)/portfolio/page.tsx`
- **Fix:** Implemented full position fetching with auth, summary cards, and position display
- **Commit:** b536b495

### Bug 2: Admin Layout Missing Auth Token
- **Issue:** Admin layout called `/api/auth/me` without Authorization header, causing authentication failures
- **File:** `src/app/[locale]/(admin)/admin/layout.tsx`
- **Fix:** Added localStorage token check and Authorization header to fetch
- **Commit:** b536b495

---

## API Endpoints Tested

| Endpoint | Method | Auth | Status |
|----------|--------|------|--------|
| `/api/auth/login` | POST | No | ✅ |
| `/api/auth/register` | POST | No | ✅ |
| `/api/auth/refresh` | POST | No | ✅ |
| `/api/auth/me` | GET | Yes | ✅ |
| `/api/markets` | GET | No | ✅ |
| `/api/markets/[id]` | GET | No | ✅ |
| `/api/markets/[id]/orderbook` | GET | No | ✅ |
| `/api/markets/[id]/resolve` | POST | Admin | ✅ |
| `/api/orders` | POST | Yes | ✅ |
| `/api/positions` | GET | Yes | ✅ |
| `/api/user/balance` | GET | Yes | ✅ |
| `/api/wallet/deposit` | POST | Yes | ✅ |
| `/api/wallet/withdraw` | POST | Yes | ✅ |
| `/api/wallet/transactions` | GET | Yes | ✅ |
| `/api/admin/stats` | GET | Admin | ✅ |
| `/api/admin/users` | GET | Admin | ✅ |
| `/api/admin/transactions` | GET | Admin | ✅ |

---

## Remaining Work / Recommendations

1. **Middleware Warning:** Next.js 16 deprecated "middleware" file convention - consider migrating to "proxy"
2. **Price History:** API returns empty array - may need seeding or implementation
3. **Registration:** Consider relaxing password requirements for MVP testing
4. **Market Create API:** Currently missing admin auth check (uses "admin" string as createdBy)

---

## Test Accounts

| Account | Email | Password | Role |
|---------|-------|----------|------|
| Demo | demo@callit.io | demo123 | User |
| Admin | admin@callit.io | admin123 | Admin |

---

**QA Status: ✅ ALL TESTS PASSING**
