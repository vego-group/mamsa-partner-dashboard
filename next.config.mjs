const NO_STORE = [{ key: "Cache-Control", value: "no-store, must-revalidate" }];

// Dashboard routes must never be served from the browser's back/forward cache
// (bfcache) or disk cache — otherwise pressing "back" after logout paints a
// stale authenticated page for a moment before the session check redirects to
// /login. Cache-Control: no-store makes the page ineligible for bfcache, so
// "back" goes straight to a fresh load (and the auth check) with no flash.
const DASHBOARD_SOURCES = [
  "/overview",
  "/units",
  "/units/:path*",
  "/calendar",
  "/bookings",
  "/reports",
  "/notifications",
  "/account",
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.mamsaa.com" },
    ],
  },
  async headers() {
    return DASHBOARD_SOURCES.map((source) => ({ source, headers: NO_STORE }));
  },
};

export default nextConfig;
