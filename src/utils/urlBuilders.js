// Utility helpers for building user-facing, SEO-friendly URLs
// Centralizing this keeps URLs consistent across the app.

/**
 * Build a SEO-friendly car details URL.
 *
 * Examples:
 * - "/cars/2020-toyota-corolla-lahore-<id>"
 * - Falls back to "/cars/<id>" if we can't generate a slug.
 */
export const buildCarUrl = (car) => {
  if (!car || !car._id) return "/cars";

  const parts = [
    car.year,
    car.make,
    car.model,
    car.city || car.location || car.region,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  if (!parts) {
    return `/cars/${car._id}`;
  }

  return `/cars/${parts}-${car._id}`;
};

/**
 * Extract the underlying database ID from a slugged car URL segment.
 *
 * Accepts either:
 * - "<id>"
 * - "some-slug-text-<id>"
 */
export const extractCarIdFromSlug = (value) => {
  if (!value || typeof value !== "string") return "";
  const segments = value.split("-");
  return segments[segments.length - 1] || "";
};

/**
 * Build a stable blog post URL.
 *
 * Uses slug when available, falls back to ID to preserve old links.
 * Examples:
 * - "/blog/how-to-buy-a-used-car"
 * - "/blog/<id>"
 */
export const buildBlogUrl = (blog) => {
  if (!blog) return "/blog";
  if (blog.slug && typeof blog.slug === "string") {
    return `/blog/${blog.slug}`;
  }
  if (blog._id) {
    return `/blog/${blog._id}`;
  }
  return "/blog";
};


