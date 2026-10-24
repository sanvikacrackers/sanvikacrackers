# 🎆 Sanvika Crackers — E-Commerce Web App

A full-featured crackers e-commerce web application built with **React + Vite**, powered by **Supabase** (database) and **Cloudinary** (image hosting), deployed on **Cloudflare Pages**.

---

## 🛠️ Tech Stack

| Layer        | Technology                        |
|--------------|-----------------------------------|
| Frontend     | React 19, React Router v7        |
| Build Tool   | Vite 8                            |
| Styling      | Vanilla CSS + Custom Design System |
| Database     | Supabase (PostgreSQL)             |
| Image Hosting| Cloudinary (Unsigned Uploads)     |
| Deployment   | Cloudflare Pages (via Wrangler)   |
| Icons        | Lucide React                      |
| PDF Export   | jsPDF + html2canvas               |
| Drag & Drop  | @hello-pangea/dnd                 |
| Toasts       | react-hot-toast                   |

---

## 📁 Project Structure

```
sanvikacrackers/
├── public/                    # Static assets
├── src/
│   ├── assets/                # Images (pricelist.png, etc.)
│   ├── components/
│   │   ├── Fireworks.jsx      # Fireworks animation overlay
│   │   ├── Footer.jsx         # Site footer
│   │   ├── Header.jsx         # Navigation header
│   │   ├── OrderToast.jsx     # Order notification toast
│   │   └── TopBar.jsx         # Announcement top bar
│   ├── context/
│   │   └── ShopContext.jsx    # Global state (products, cart, wishlist)
│   ├── lib/
│   │   ├── api.js             # Supabase REST API helper
│   │   ├── cloudinary.js      # Cloudinary upload/delete helpers
│   │   └── supabase.js        # Supabase client initialization
│   ├── pages/
│   │   ├── Home.jsx           # Homepage with hero banners
│   │   ├── Products.jsx       # Product listing with filters
│   │   ├── ProductDetail.jsx  # Single product view
│   │   ├── Cart.jsx           # Shopping cart
│   │   ├── Wishlist.jsx       # Wishlist page
│   │   ├── About.jsx          # About us page
│   │   ├── Contact.jsx        # Contact page
│   │   ├── Safety.jsx         # Safety guidelines page
│   │   └── Admin.jsx          # Full admin panel (all sections)
│   ├── utils/
│   │   └── useSEO.js          # SEO hook for page meta tags
│   ├── App.jsx                # Root component with routes
│   ├── App.css                # Main application styles
│   ├── Admin.css              # Admin panel styles
│   ├── index.css              # Base styles
│   └── main.jsx               # Entry point
├── .env                       # Environment variables
├── vite.config.js             # Vite configuration
├── wrangler.jsonc             # Cloudflare deployment config
└── package.json
```

---

## 🌐 Routes / Pages

### Customer-Facing Pages

| Route               | Page             | Description                        |
|----------------------|------------------|------------------------------------|
| `/`                  | Home             | Hero banners, featured products    |
| `/products`          | Products         | All products with search & filters |
| `/products/:id`      | Product Detail   | Single product with image gallery  |
| `/cart`              | Cart             | Shopping cart with qty controls     |
| `/wishlist`          | Wishlist         | Saved products                     |
| `/about`             | About            | About Sanvika Crackers             |
| `/contact`           | Contact          | Contact form & details             |
| `/safety`            | Safety           | Fireworks safety guidelines        |

### Admin Panel Pages

| Route                   | Page              | Description                        |
|--------------------------|-------------------|------------------------------------|
| `/admin/login`           | Admin Login       | Email + password authentication    |
| `/admin/dashboard`       | Dashboard         | Overview & stats                   |
| `/admin/orders`          | Orders            | View & manage customer orders      |
| `/admin/categories`      | Categories        | Manage product categories          |
| `/admin/products`        | Products          | Add/edit/delete products           |
| `/admin/banners`         | Hero Banners      | Manage homepage slider banners     |
| `/admin/announcement`    | Announcement      | Set top bar announcement text      |
| `/admin/settings`        | Settings          | Min order, WhatsApp, pricelist URL |

---

## 🔐 Admin Credentials

| Field      | Value                            |
|------------|----------------------------------|
| **Email**  | `sanvikacrackers2020@gmail.com`  |
| **Password** | `Sanvika$77`                  |

> ⚠️ These are hardcoded in `Admin.jsx` (line ~386). For production, consider moving to Supabase Auth.

---

## 🗄️ Supabase Database Schema

**Project:** `sanvikacrackers@gmail.com's Project`
**Region:** `ap-southeast-2` (Sydney)
**Project Ref:** `fdbzwjxeitnlezqlufev`
**Database URL:** `https://fdbzwjxeitnlezqlufev.supabase.co`

### Table: `products` (155 rows)

| Column               | Type                     | Nullable | Default            |
|------------------------|--------------------------|----------|--------------------|
| `id`                  | `uuid`                   | NO       | `gen_random_uuid()`|
| `product_code`        | `text`                   | NO       | —                  |
| `name`                | `text`                   | NO       | —                  |
| `category`            | `text`                   | NO       | —                  |
| `description`         | `text`                   | YES      | —                  |
| `mrp`                 | `numeric`                | YES      | —                  |
| `price`               | `numeric`                | YES      | —                  |
| `discount_percentage` | `numeric`                | YES      | —                  |
| `order_unit`          | `text`                   | YES      | —                  |
| `image_url`           | `text`                   | YES      | —                  |
| `is_active`           | `boolean`                | YES      | `true`             |
| `created_at`          | `timestamp with time zone`| YES     | `now()`            |
| `updated_at`          | `timestamp with time zone`| YES     | `now()`            |

> **Special Row:** A product with `category = '__SITE_SETTINGS__'` and `product_code = '__settings__'` stores site-wide settings (min order values, WhatsApp number, announcement text) as JSON in the `description` field.

### Table: `orders` (0 rows)

| Column          | Type                     | Nullable | Default                 |
|------------------|--------------------------|----------|-------------------------|
| `id`            | `uuid`                   | NO       | `gen_random_uuid()`     |
| `customer_name` | `text`                   | NO       | —                       |
| `phone`         | `text`                   | NO       | —                       |
| `address`       | `text`                   | YES      | —                       |
| `items`         | `text`                   | YES      | —                       |
| `total`         | `numeric`                | YES      | —                       |
| `status`        | `text`                   | YES      | `'Payment Pending'`     |
| `created_at`    | `timestamp with time zone`| YES     | `now()`                 |

### Table: `hero_banners` (1 row)

| Column       | Type                     | Nullable | Default            |
|---------------|--------------------------|----------|--------------------|
| `id`         | `uuid`                   | NO       | `gen_random_uuid()`|
| `image_url`  | `text`                   | NO       | —                  |
| `title`      | `text`                   | YES      | —                  |
| `target_url` | `text`                   | YES      | —                  |
| `sort_order` | `integer`                | YES      | `0`                |
| `is_active`  | `boolean`                | YES      | `true`             |
| `created_at` | `timestamp with time zone`| YES     | `now()`            |
| `updated_at` | `timestamp with time zone`| YES     | `now()`            |

---

## 🔒 Row Level Security (RLS) Policies

All tables have **RLS enabled** with the following policies:

| Table           | Policy Name                            | Access | Roles                  |
|------------------|----------------------------------------|--------|------------------------|
| `products`      | Allow public read access on products   | SELECT | `anon`, `authenticated`|
| `products`      | Allow anon full access on products     | ALL    | `anon`, `authenticated`|
| `orders`        | Allow public read access on orders     | SELECT | `anon`, `authenticated`|
| `orders`        | Allow anon full access on orders       | ALL    | `anon`, `authenticated`|
| `hero_banners`  | Public can read hero_banners           | SELECT | `public`               |
| `hero_banners`  | Anon full access hero_banners          | ALL    | `public`               |

---

## ☁️ Cloudinary Configuration

| Setting          | Value              |
|-------------------|--------------------|
| **Cloud Name**   | `lqcqo41j`         |
| **Upload Preset**| `ml_default`       |
| **Mode**         | Unsigned           |
| **API Key**      | `496563915519741`  |
| **API Secret**   | `dO7qvEG3EEDLIghEWRXqHoQhHX8` |

### Image Upload Flow
```
User uploads image in Admin Panel
        │
        ▼
Image sent to Cloudinary (unsigned upload, ml_default preset)
        │
        ▼
Cloudinary returns secure_url
(e.g. https://res.cloudinary.com/lqcqo41j/image/upload/...)
        │
        ▼
URL stored in Supabase (products.image_url or hero_banners.image_url)
        │
        ▼
Frontend fetches from Supabase → renders Cloudinary URLs as <img> tags
```

---

## 📦 Product Categories (21 categories, 154 products)

| Category                 | Products |
|--------------------------|----------|
| Bijili Crackers          | 2        |
| Block Serpents           | 1        |
| Bombs                    | 7        |
| Colour Fountains         | 25       |
| Deluxe Crackers          | 3        |
| Fancy Outs               | 16       |
| Flower Pots              | 7        |
| Garlands                 | 9        |
| Giants Crackers          | 2        |
| Gift Boxes               | 9        |
| Ground Crackers          | 5        |
| Matches                  | 2        |
| Paper Party              | 3        |
| Peacock                  | 4        |
| Pencils                  | 4        |
| Repeating Shots          | 12       |
| Rockets                  | 5        |
| Single Sound Crackers    | 8        |
| Sparklers                | 23       |
| Thunder Bolt Crackers    | 5        |
| Twinkling Stars          | 2        |

---

## ⚙️ Environment Variables (`.env`)

```env
# ── Supabase ─────────────────────────────────────────
VITE_SUPABASE_URL=https://fdbzwjxeitnlezqlufev.supabase.co
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>

# ── Cloudinary ────────────────────────────────────────
VITE_CLOUDINARY_CLOUD_NAME=lqcqo41j
VITE_CLOUDINARY_UPLOAD_PRESET=ml_default
VITE_CLOUDINARY_API_KEY=496563915519741
VITE_CLOUDINARY_API_SECRET=dO7qvEG3EEDLIghEWRXqHoQhHX8
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm

### Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# → opens at http://localhost:5173/
```

### Build & Deploy

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# Deploy to Cloudflare Pages
npm run deploy
```

---

## 🧩 Key Features

### Customer Side
- 🏠 **Hero Banner Slider** — Auto-rotating banners managed from admin
- 🔍 **Product Search & Filters** — Search by name, filter by category, sort by price
- 🛒 **Shopping Cart** — Add/remove items, adjust quantities, persisted in localStorage
- ❤️ **Wishlist** — Save favorite products, persisted in localStorage
- 📱 **Responsive Design** — Works on mobile, tablet, and desktop
- 🎆 **Fireworks Animation** — Festive background animation
- 📋 **Product Detail Page** — Image gallery, pricing, description
- 📞 **WhatsApp Order** — Send cart as WhatsApp message

### Admin Side
- 📊 **Dashboard** — Product & order statistics
- 📦 **Product Management** — Add, edit, delete products with image upload
- 🗂️ **Category Management** — Manage categories with banner images
- 🖼️ **Hero Banner Management** — Upload & arrange homepage banners
- 📢 **Announcement Bar** — Set scrolling announcement text
- 📋 **Order Management** — View orders with status tracking
- ⚙️ **Settings** — Minimum order amounts, WhatsApp number, pricelist URL
- 📄 **PDF Export** — Export product lists and orders as PDF

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                   BROWSER (Client)                  │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Home    │  │ Products │  │   Admin Panel    │  │
│  │  Page    │  │  Page    │  │  (Login-gated)   │  │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
│       │              │                 │             │
│       └──────────────┼─────────────────┘             │
│                      │                               │
│              ┌───────▼────────┐                      │
│              │  ShopContext   │                      │
│              │  (Global State)│                      │
│              └───────┬────────┘                      │
└──────────────────────┼───────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼                         ▼
┌──────────────────┐    ┌──────────────────┐
│    SUPABASE      │    │   CLOUDINARY     │
│   (Database)     │    │  (Image CDN)     │
│                  │    │                  │
│  • products      │    │  • Upload images │
│  • orders        │◄───│  • Store URLs    │
│  • hero_banners  │    │  • Delete images │
│                  │    │                  │
│  REST API +      │    │  Unsigned upload │
│  Anon Key Auth   │    │  (ml_default)    │
└──────────────────┘    └──────────────────┘
          │
          ▼
┌──────────────────┐
│  CLOUDFLARE      │
│  PAGES           │
│  (Deployment)    │
│                  │
│  SPA mode with   │
│  Wrangler CLI    │
└──────────────────┘
```

---

## 📝 Notes

- **Site Settings** are stored as a special product row with `category = '__SITE_SETTINGS__'` — the `description` field contains a JSON string with min order amounts, WhatsApp number, and announcement text.
- **Cart & Wishlist** data is stored in the browser's `localStorage`, not in Supabase.
- **Admin auth** is hardcoded (not using Supabase Auth). Session is stored in `sessionStorage`.
- **Product images** can store multiple URLs as a JSON array string in the `image_url` field.
- **Discount** is auto-calculated from `mrp` vs `price` if `discount_percentage` is not explicitly set.
