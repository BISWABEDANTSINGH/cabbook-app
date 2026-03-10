# CabBook 🚖 | Full-Stack Ride-Sharing Platform

CabBook is a comprehensive, real-time ride-sharing application inspired by industry leaders like Uber and Lyft. Built with a modern, scalable tech stack, this platform features three distinct, role-based experiences: a Rider booking interface, a Driver dispatch terminal, and an Administrator control panel.

![CabBook Interface Overview](https://via.placeholder.com/1000x500.png?text=CabBook+Ride-Sharing+Platform)

## 🚀 Key Features

### 🧍 For Riders
* **Interactive Mapping:** Pinpoint pickup and drop-off locations using the Google Maps API.
* **Dynamic Ride Selection:** Choose between Economy, Premium, and SUV tiers with dynamic pricing based on route distance.
* **Real-time Tracking:** View driver ETA, wait times, and simulated live transit progress.
* **Secure Payments:** Integrated payment simulation via Stripe.
* **Safety First:** Built-in Emergency SOS button and post-ride rating/review system.
* **Help Center:** Submit support tickets directly to the platform administrators.

### 👨🏽‍✈️ For Drivers
* **Driver Terminal:** Toggle online/offline availability to receive incoming ride requests.
* **Open Dispatch:** View active ride requests, estimated payouts, and route distances before accepting.
* **Earnings Dashboard:** Real-time gamified dashboard tracking total historical earnings and current ride payouts.

### 👑 For Administrators
* **Role-Based Access Control (RBAC):** Secure admin panel inaccessible to standard users.
* **Support Management:** Review, respond to, and resolve user support tickets in real-time.
* **User Directories:** View and manage registered riders and drivers, including the ability to permanently ban/delete users (cascading database deletion).

---

## 🛠️ Tech Stack

* **Framework:** [Next.js](https://nextjs.org/) (React)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Authentication:** [Clerk](https://clerk.com/)
* **Database & Real-time:** [Supabase](https://supabase.com/) (PostgreSQL)
* **Maps & Routing:** [Google Maps JavaScript API](https://developers.google.com/maps)
* **Payments:** [Stripe](https://stripe.com/)
* **Deployment:** [Vercel](https://vercel.com/)

---

## ⚙️ Local Development Setup

Follow these steps to run the CabBook platform on your local machine.

### 1. Clone the repository
```bash
git clone [https://github.com/BISWABEDANTSINGH/cabbook-app.git](https://github.com/BISWABEDANTSINGH/cabbook-app.git)
cd cabbook-app
