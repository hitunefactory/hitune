# HI TUNE STUDIO — Smart Order & Production Management System
> **স্মার্ট অর্ডার ও প্রোডাকশন ম্যানেজমেন্ট সিস্টেম**
> জামালপুর, বাংলাদেশ (Jamalpur, Bangladesh)

---

## 🌟 ওভারভিউ (Project Overview)

**HI TUNE STUDIO** হলো জামালপুর, বাংলাদেশে অবস্থিত পেশাদার অডিও-ভিডিও প্রোডাকশন স্টুডিওর জন্য নির্মিত একটি আধুনিক, ফুল-স্ট্যাক ও রিয়েল-টাইম প্রোডাকশন ম্যানেজমেন্ট প্ল্যাটফর্ম।

সিস্টেমটি সম্পূর্ণ প্রোডাকশন-রেডি অবস্থায় রয়েছে—**সকল ডামি ডাটা রিমুভ করা হয়েছে** এবং **ম্যানুয়াল অ্যাকাউন্ট রেজিস্ট্রেশন ও ক্লাউডফ্লেয়ার পেজেস (Cloudflare Pages) ডিপ্লয়মেন্ট সম্পূর্ণ প্রস্তুত**।

---

## 🚀 প্রযুক্তি ও আর্কিটেকচার (Tech Stack)

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts
- **Backend & Database**: Supabase (PostgreSQL, Row Level Security, Auth, Realtime, Storage)
- **Deployment Platform**: Cloudflare Pages (with `_redirects` SPA routing & `_headers`)
- **Routing**: React Router DOM (v7)
- **State Management**: Context API & TanStack Query
- **Design System**: Premium Dark Navy (`#0B1120`, `#070B14`) and Charcoal Theme with Modern Blue Accents, full Bengali-first typography (`Hind Siliguri`).

---

## 🔐 অ্যাকাউন্ট তৈরি ও লগইন সিস্টেম (Manual Registration System)

অ্যাপ্লিকেশনের লগইন পেজে দুটি অপশন রয়েছে:
1. **লগইন (Sign In)**: নিবন্ধিত ইমেইল ও পাসওয়ার্ড দিয়ে সরাসরি অ্যাকাউন্টে প্রবেশ।
2. **নতুন অ্যাকাউন্ট তৈরি (Register / Sign Up)**:
   - পূর্ণ নাম (ইংরেজি)
   - বাংলা নাম
   - ইমেইল ঠিকানা
   - মোবাইল নম্বর
   - পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড (ন্যূনতম ৬ অক্ষর)
   - ভূমিকা (Super Admin, Order Manager, Audio Designer, Video Editor, Quality Controller, Delivery Manager, Accountant)
   - বিভাগ (Management, Audio, Video, QC, Delivery, Accounts)

নিবন্ধন সম্পন্ন হওয়ামাত্র স্বয়ংক্রিয়ভাবে অ্যাকাউন্ট প্রোফাইল তৈরি হয়ে ব্যবহারকারী ড্যাশবোর্ডে প্রবেশ করতে পারবেন।

---

## ☁️ ক্লাউডফ্লেয়ার পেজেস (Cloudflare Pages) ডিপ্লয়মেন্ট গাইড

এই প্রজেক্টটি Cloudflare Pages-এ ডিপ্লয় করার জন্য শতভাগ প্রস্তুত। নিচে ধাপে ধাপে নির্দেশনা দেওয়া হলো:

### ধাপ ১: গিট রিপোজিটরি পুশ (GitHub / GitLab)
```bash
git add -A
git commit -m "feat: production ready for cloudflare pages"
git remote add origin https://github.com/<your-username>/hi-tune-studio.git
git push -u origin master
```

### ধাপ ২: Cloudflare ড্যাশবোর্ডে প্রজেক্ট তৈরি
১. [dash.cloudflare.com](https://dash.cloudflare.com) এ লগইন করুন।
২. **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git** সিলেক্ট করুন।
৩. আপনার রিপোজিটরি (`hi-tune-studio`) নির্বাচন করুন।

### ধাপ ৩: বিল্ড কনফিগারেশন সেটিংস
Cloudflare Pages-এর বিল্ড সেটিংস হুবহু নিচের মতো দিন:
- **Framework preset**: `Vite` (অথবা `None`)
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Node.js version**: `20` বা তার উপরে

### ধাপ ৪: এনভায়রনমেন্ট ভেরিয়েবল (Environment Variables)
Cloudflare Pages-এর **Environment variables** সেকশনে নিচের দুটি ভেরিয়েবল যোগ করুন:
```env
VITE_SUPABASE_URL=https://rebwquvphyrfhwqbdojs.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_cqmJJfuyluLuM5XdRICDfw_zT8owdal
```

### ধাপ ৫: Deploy চাপুন
**Save and Deploy** বাটনে ক্লিক করলেই কয়েক সেকেন্ডের মধ্যে আপনার প্রজেক্টটি বিশ্বমানের Cloudflare গ্লোবাল এজ নেটওয়ার্কে লাইভ হয়ে যাবে! 
SPA রাউটিংয়ের জন্য `public/_redirects` আগেই যুক্ত করা রয়েছে, তাই যেকোনো পেজ রিফ্রেশ করলেও কোনো 404 ত্রুটি আসবে না।

---

## 🗄️ সুপাবেস ডাটাবেজ সেটআপ (Supabase SQL Migrations)

আপনার সুপাবেস প্রজেক্টের **SQL Editor**-এ নিচের দুটি ফাইল ক্রমানুসারে রান করুন:
1. `supabase/migrations/20261123000001_initial_schema.sql` (২২টি ডাটাবেজ টেবিল, সিকোয়েন্স ও ট্রিগার)
2. `supabase/migrations/20261123000002_auth_and_permissions.sql` (অথেনটিকেশন ট্রিগার ও আরএলএস পারমিশন গ্রান্ট)

---

## 💻 লোকাল টেস্ট ও রান করার নিয়ম

```powershell
cd "c:\Users\H.I Tune\Desktop\hi-tune-studio"
npm.cmd run dev
```
ব্রাউজারে চালু হবে: `http://localhost:5173`
প্রোডাকশন বিল্ড টেস্ট করতে:
```powershell
npm.cmd run build
```
"# hitune" 
