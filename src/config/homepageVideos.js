/**
 * Homepage hero + platform preview videos.
 *
 * Served from /public/videos so Vercel deploys them as static files (not webpack
 * bundles). Override with env vars if you host on a CDN later.
 */
const publicUrl = process.env.PUBLIC_URL || '';

export const HOMEPAGE_VIDEOS = {
  heroAnimation:
    process.env.REACT_APP_HERO_VIDEO_URL ||
    `${publicUrl}/videos/hero-animation.mp4`,
  platformPreview:
    process.env.REACT_APP_PLATFORM_VIDEO_URL ||
    `${publicUrl}/videos/platform-preview.mp4`,
};

/** Optional poster shown while the video loads or if playback fails. */
export const HOMEPAGE_VIDEO_POSTERS = {
  heroAnimation: `${publicUrl}/videos/posters/hero-animation.jpg`,
  platformPreview: `${publicUrl}/videos/posters/platform-preview.jpg`,
};

/** Smaller fallbacks if the full-size deploy assets fail to load. */
export const HOMEPAGE_VIDEO_FALLBACKS = {
  heroAnimation: `${publicUrl}/videos/fallback/hero-animation.mp4`,
  platformPreview: `${publicUrl}/videos/fallback/platform-preview.mp4`,
};
