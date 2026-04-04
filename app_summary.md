This Product Requirements Document (PRD) outlines the vision, features, and technical framework for **Homebite**, a specialized marketplace designed to bridge the gap between home-based F&B MSMEs and local consumers.

---

# Product Requirements Document (PRD): Homebite

**Status:** Draft / Discovery  
**Tech Stack:** Next.js (App Router), Tailwind CSS, shadcn/ui, PostgreSQL (Prisma/Drizzle ORM)

---

## 1. Executive Summary
**Homebite** is a full-stack marketplace platform that enables home-based food businesses (*Mitra*) to sell products online while providing them with integrated, simplified financial management tools. Unlike generic delivery apps, Homebite focuses on business sustainability by offering automated profit/loss reporting and a performance-based tiering system.

## 2. Target Audience
* **Mitra (Sellers):** Home-based culinary entrepreneurs who lack formal bookkeeping and digital storefronts.
* **Customers:** Individuals looking for authentic, homemade, and local food options.
* **Administrators:** Platform owners managing KYC, disputes, and ecosystem health.

---

## 3. Functional Requirements

### 3.1. Mitra Module (The Business Suite)
| Feature | Description |
| :--- | :--- |
| **Storefront Management** | Create and edit digital menus, set stock levels, and manage Pre-Order (PO) schedules. |
| **Order Management** | Real-time tracking of incoming orders, processing status, and delivery coordination. |
| **Expense Tracker** | A manual input interface for costs: raw materials, packaging, gas, and electricity. |
| **Financial Dashboard** | Automated generation of Profit/Loss (P&L) statements and Cash Flow insights. |
| **Tier Tracking** | Visual progress bar showing current status (Silver/Gold/Platinum) and requirements for the next level. |

### 3.2. Customer Module (The Marketplace)
| Feature | Description |
| :--- | :--- |
| **Discovery Engine** | Geolocation-based search, category filters (e.g., "Desserts," "Halal," "Healthy"), and rating-based sorting. |
| **Seamless Checkout** | Integration with payment gateways (Midtrans/Xendit) and multiple shipping options. |
| **Trust System** | Multi-factor reviews (Food Quality, Packaging, Delivery Speed) and photo uploads. |
| **Order History** | Tracking active orders and archived purchase history for easy re-ordering. |

### 3.3. Admin Module (The Control Tower)
| Feature | Description |
| :--- | :--- |
| **KYC Verification** | Reviewing Mitra identity (ID cards/Dapur photos) to ensure food safety and authenticity. |
| **Commission Engine** | Configurable platform fee logic based on Mitra tiers. |
| **Dispute Resolution** | Interface to handle refunds or complaints between customers and sellers. |

---

## 4. Financial Reporting Logic
The system differentiates between **Passive Data** (System-generated) and **Active Data** (User-inputted).

1.  **Revenue (Auto):** Sum of `Order_Total` minus `Platform_Fee`.
2.  **COGS/Expenses (Manual):** User inputs specific entries under categories (Ingredients, Marketing, Utility).
3.  **Net Profit Calculation:** $$\text{Net Profit} = \sum \text{Revenue} - \sum \text{Expenses}$$
4.  **Business Insights:** The system calculates the "Break-even Point" or "Top-spending Category" to help the Mitra optimize their budget.

---

## 5. Mitra Tiering System (Gamification)

| Tier | Requirements (Monthly) | Benefits |
| :--- | :--- | :--- |
| **Silver** | Entry Level | Standard platform fee, basic P&L reports. |
| **Gold** | >20 Orders, Min. Rating 4.5 | 2% Reduction in platform fees, "Verified" badge. |
| **Platinum** | >100 Orders, Min. Rating 4.8 | Lowest platform fees, homepage spotlight, advanced business analytics. |

---

## 6. Non-Functional Requirements
* **Performance:** < 2s page load using Next.js Server Components.
* **Security:** JWT-based authentication (NextAuth.js) and Row Level Security (RLS) in PostgreSQL.
* **Scalability:** Image assets hosted on Vercel Blob or AWS S3; Database indexed for geolocation queries.
* **Mobile-First UI:** Fully responsive design using Tailwind CSS for users ordering via smartphones.

---

## 7. Success Metrics (KPIs)
* **GMV (Gross Merchandise Value):** Total value of sales processed.
* **Mitra Retention:** Percentage of sellers who input expenses at least once a week.
* **Customer Trust Score:** Average rating across all transactions.
* **Conversion Rate:** Percentage of users who land on a product page and complete a purchase.

---

## 8. Development Roadmap
* **Phase 1 (MVP):** Auth, Mitra Onboarding, Product Catalog, and Basic Checkout.
* **Phase 2:** Financial Dashboard & Expense Tracker integration.
* **Phase 3:** Tiering Algorithm, Reviews, and Advanced Admin Analytics.

How do you feel about the **Financial Reporting** logic? Should we add an automated integration for ingredient prices, or keep it manual for maximum flexibility for the UMKM?