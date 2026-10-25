# Sanvika Crackers — User-Facing Website Content Overview

This document describes every section and piece of content on the **customer-facing (UI) side** of the Sanvika Crackers website. Use this to suggest a proper color palette.

---

## About the Brand

- **Brand name**: Sanvika Crackers
- **Industry**: Fireworks / Crackers (retail + wholesale)
- **Location**: Sivakasi, Tamil Nadu, India (the fireworks capital of India)
- **Business model**: Factory-direct. No direct online sale — customers browse products and send a WhatsApp enquiry.
- **Audience**: Retail customers and bulk buyers across India who want premium crackers at factory-direct prices.
- **Catalog size**: 127+ products across 21 categories
- **Tone to convey**: Premium, festive, trustworthy, celebratory

---

## Website Structure (Pages)

### 1. Home Page
The main landing page. Contains:

| Section | Content |
|---|---|
| **Announcement bar** (top) | Scrolling text: "Browse our products and send enquiry via WhatsApp. Not a direct sale portal." |
| **Header / Nav** | Logo, 5 nav links (Home, About, Products, Safety Tips, Contact), Search, Wishlist icon, Cart icon |
| **Hero Banner Carousel** | Auto-rotating promotional banners loaded from database. Arrows + dot navigation. |
| **Welcome Section** | Heading: "Welcome to Sanvika Crackers" · Company intro text · "Shop Now" CTA button · Decorative circular product images · Stat highlight: "127+ Products · 21 Categories · Factory Direct" |
| **Category Showcase** | 6 featured category cards as square image tiles with category name overlay |
| **CTA Band** | Heading: "Explore Sanvika Crackers" · "Shop Now" button |
| **Services Strip** | 4 cards: 24hrs Shipping · 100% Satisfied Guarantee · 30+ Varieties · Low Price |
| **Products by Category** | Multiple sections, one per category. Each shows a grid of product cards (image, name, price, Add to Cart). |
| **Footer** | Contact info, accepted payments, legal disclaimer, copyright |

---

### 2. Products Page (`/products`)
Full product catalog with filtering.

| Element | Content |
|---|---|
| **Page title bar** | "All Products" heading · product count · search bar · mobile filter button |
| **Filter Sidebar** | Search input · Price range slider · Category checkboxes with counts · "Clear all" |
| **Product Grid** | 2–4 columns. Each card: product image, category badge, name, order unit, price, discount badge (if any), "Add to Cart" button or quantity adjuster (+/−) |
| **Empty state** | Shown when no results match the filter. "Clear Filters" button. |
| **Footer** | Same as Home |

---

### 3. Product Detail Page (`/product/:id`)
Individual product view.

| Element | Content |
|---|---|
| **Back button** | "← Back" pill navigation |
| **Product images** | Large main image · thumbnail carousel for multiple images · wishlist heart overlay · discount badge |
| **Product info** | Category badge · Product name (large) · "In Stock" badge · Price (current price, strikethrough MRP, % discount, savings amount) · Description text · Packaging & order unit info |
| **Add to cart** | "Add to Cart" button → becomes +/− quantity adjuster + "View Cart" link |
| **Similar products** | Grid of 8 products from the same category |
| **Footer** | Same as Home |

---

### 4. Cart Page (`/cart`)
Order summary and WhatsApp enquiry form.

| Element | Content |
|---|---|
| **Cart items** | List of added products: image, name, price, quantity adjuster, remove button |
| **Order summary** | Subtotal · Freight (Extra) · Total amount |
| **Details form** | State selector (Tamil Nadu / Other) · Name · Phone · Address · "Send WhatsApp Enquiry" button |
| **Minimum order note** | State-specific minimum order amount |
| **Success state** | "Enquiry Sent!" confirmation screen after WhatsApp message is sent |
| **Empty state** | "Your cart is empty" with "Shop Products" button |
| **Payment methods** | Icons: cards, GPay etc. (display only) |
| **Footer** | Same as Home |

---

### 5. Wishlist Page (`/wishlist`)
Saved products.

| Element | Content |
|---|---|
| **Page title** | "My Wishlist" with item count |
| **Product grid** | 1–4 columns. Each card: image, name, description, price, order unit, "Add to Cart" or qty adjuster |
| **Empty state** | Heart icon · "Your wishlist is empty" · "Browse Products" button |
| **Footer** | Same as Home |

---

### 6. About Page (`/about`)
Brand story and credibility.

| Section | Content |
|---|---|
| **Hero** | Dark background · "About Sanvika Crackers" heading · Product image |
| **Our Story** | Company background text |
| **Stats** | 127+ Products · 21 Categories · 100% Factory Direct · 4 Contact Numbers |
| **Why Choose Us** | 6 feature cards: Factory Direct Prices · Genuine & Safe Products · Wide Range · Fast Delivery · Trusted Since Years · Easy Online Ordering |
| **CTA Strip** | "Ready to Order?" heading · "Contact Us" button |
| **Footer** | Same as Home |

---

### 7. Contact Page (`/contact`)
Get in touch.

| Section | Content |
|---|---|
| **Hero** | "Contact Us" heading + description |
| **Info cards** | Address · Mobile number (clickable) · Email (clickable) |
| **Map** | Google Maps embed showing Sivakasi location · "Get Directions" button |
| **Contact form** | Fields: Name, Phone, Email, Message · "Send via WhatsApp" button |
| **Footer** | Same as Home |

---

### 8. Safety Tips Page (`/safety`)
Firecracker safety guidelines.

| Section | Content |
|---|---|
| **Hero image** | Full-width safety-themed banner |
| **Intro** | "SANVIKA CRACKERS" heading · safety guidelines intro text |
| **Do's (6 items)** | Instructions · Use Outdoors · Use Branded Fireworks · Maintain Distance · Adult Supervision · Keep Water Nearby |
| **Don'ts (6 items)** | Don't Make Tricks · Don't Relight · Don't Carry in Pockets · Don't Touch Leftovers · No Glass/Metal Containers · No Loose Clothing |
| **CTA button** | "Shop Safely" |
| **Footer** | Same as Home |

---

## Persistent Components (Appear on Every Page)

### TopBar (Very top strip)
- Scrolling marquee with announcement text + disclaimer
- Small, dark background

### Header / Navigation
- Logo (top-left)
- Nav links: Home, About, Products, Safety Tips, Contact
- Search bar (expandable)
- Wishlist button with count badge
- Cart button with count badge
- Mobile: hamburger menu → sidebar drawer

### Footer
- Left: Logo + Phone, Address, Email with icons
- Right: Accepted payment methods (cards, UPI, GPay)
- Legal box: Supreme Court compliance notice for fireworks
- Bottom bar: Copyright
- **Floating action buttons** (fixed, bottom-right):
  - Call Us (phone)
  - WhatsApp
  - Facebook

---

## Visual Elements Summary

| Element | Details |
|---|---|
| **Product cards** | Image, name, price, category badge, discount ribbon, heart icon, Add to Cart |
| **Buttons** | Primary CTA (filled) · Quantity +/− controls · Pill/rounded navigation buttons |
| **Badges** | Discount % ribbon (corner) · Category tags · "In Stock" badge · Cart count badge |
| **Forms** | Contact form, cart form — all WhatsApp-based, no email backend |
| **Icons used** | Heart (wishlist) · ShoppingCart · Search · Phone · MapPin · Mail · Menu · Check · X · Download · Shield |
| **Dark sections** | Welcome section, hero sections, CTA bands — use a dark background |
| **Light sections** | Product grids, services, category showcase — use a light/white background |
| **Animated elements** | Banner carousel · scrolling marquee · floating FAB buttons · image hover zoom |

---

## Color Palette Context for ChatGPT

Use the above content to suggest a color palette. Key considerations:

1. **Brand personality**: Premium, festive, celebratory, South Indian culture, Diwali energy
2. **Product**: Fireworks — associated with fire, light, celebration, night sky, sparkle
3. **Audience**: Indian families, bulk buyers — needs to feel trustworthy and premium
4. **Usage split**: ~60% dark sections (hero areas, header, topbar) + ~40% white/light sections (product grids, cards)
5. **Required roles**:
   - `Primary` — main CTA buttons (Add to Cart, Shop Now, Send Enquiry)
   - `Dark background` — header, topbar, hero sections, CTA bands
   - `Price / Gold` — product prices, discount highlights, section labels
   - `Light tint` — card backgrounds, filter sidebar tint, form inputs
   - `Light border` — card outlines, input borders, dividers
6. **Must feel**: Joyful and festive without being cheap. Premium without being cold.
7. **Avoid**: Pastels, neon, corporate blue, plain grey

---

*This document covers the customer-facing UI only. Admin and staff management panels are separate and not included here.*
