import { Platform } from '../../generated/prisma/client.js';

/**
 * Redis cache key helper for temporary OAuth state transactions.
 * Stores cryptographically secure random state bound to the authenticated user ID and platform.
 *
 * @param state - The cryptographically generated state string.
 * @returns Fully qualified Redis key string.
 *
 * @example
 * ```typescript
 * const key = KEY_OAUTH_STATE('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed');
 * // returns 'social:oauth-state:1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
 * ```
 */
export const KEY_OAUTH_STATE = (state: string): string => `social:oauth-state:${state}`;

/**
 * Time-To-Live (in seconds) for temporary OAuth state challenges stored in Redis.
 * 10 minutes ensures ample time for user consent on third-party provider pages.
 */
export const OAUTH_STATE_TTL_SECONDS = 10 * 60;

/**
 * Provider-to-Platform enum mapping for consistent type-safe lookup.
 */
export const SUPPORTED_SOCIAL_PLATFORMS = {
  YOUTUBE: Platform.YOUTUBE,
  LINKEDIN: Platform.LINKEDIN,
  X_TWITTER: Platform.X_TWITTER,
  INSTAGRAM: Platform.INSTAGRAM,
} as const;

/**
 * Comprehensive OAuth scopes requested for each platform for social automation, media publishing,
 * post reading, writing, deleting, and Google Drive media selection.
 */
export const OAUTH_SCOPES = {
  /**
   * Google OAuth 2.0 Scopes:
   * - YouTube: Full management (read, write/upload, edit, and delete videos and channel content)
   * - Google Drive: Read, fetch, select, and stream media files from user's Drive for automated post attachments
   * - Userinfo: Basic profile and email for account identification
   */
  YOUTUBE: [
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtube.force-ssl',
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ],

  /**
   * LinkedIn OAuth 2.0 Scopes:
   * - Member Social: Read (r_member_social), Write & Delete (w_member_social) author's posts and media
   * - OpenID Connect: Basic identity, profile, and email verification
   */
  LINKEDIN: ['openid', 'profile', 'email', 'w_member_social', 'r_member_social'],

  /**
   * X (Twitter) API v2 OAuth 2.0 Scopes:
   * - tweet.read: Read tweets, user timeline, and mentions
   * - tweet.write: Create, publish, edit, and delete tweets on behalf of the user
   * - users.read: Retrieve account profile details
   * - media.write: Upload and attach images and video media to tweets
   * - offline.access: Issue long-lived refresh tokens for background scheduled worker publishing
   */
  X_TWITTER: ['tweet.read', 'tweet.write', 'users.read', 'media.write', 'offline.access'],

  /**
   * Instagram Graph API & Basic Display Scopes:
   * - instagram_basic: Read user profile and media
   * - instagram_content_publish: Publish and schedule single photos, carousels, videos, and reels
   * - instagram_manage_comments: Read, post, and delete comments on published posts
   * - instagram_manage_insights: Read post performance metrics
   * - pages_show_list: Access Facebook pages connected to Instagram Professional accounts
   * - pages_read_engagement: Read page engagement metrics
   * - user_profile & user_media: Legacy/Basic Display fallback for media retrieval
   */
  INSTAGRAM: [
    'instagram_basic',
    'instagram_content_publish',
    'instagram_manage_comments',
    'instagram_manage_insights',
    'pages_show_list',
    'pages_read_engagement',
    'user_profile',
    'user_media',
  ],
} as const;
