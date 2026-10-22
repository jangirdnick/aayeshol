import type { SocialPlatformConfig } from '../types';

export const SUPPORTED_SOCIAL_PLATFORMS: SocialPlatformConfig[] = [
  {
    id: 'LINKEDIN',
    name: 'LinkedIn',
    category: 'Professional Network',
    description:
      'Publish company updates, leadership articles, and multi-slide PDF carousels directly to your personal profile or corporate organization page.',
    capabilities: [
      'Text & Link Posts',
      'Single & Multi Images',
      'PDF Document Carousels',
      'Analytics',
    ],
    docsUrl:
      'https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin',
  },
  {
    id: 'X_TWITTER',
    name: 'X (Twitter)',
    category: 'Microblogging',
    description:
      'Schedule automated single posts, multi-tweet threads, and video uploads using official Twitter API v2 with PKCE token security.',
    capabilities: ['Single Tweets', 'Thread Storms', 'Video & GIF Delivery', 'Engagement Metrics'],
    docsUrl: 'https://developer.x.com/en/docs/twitter-api',
  },
  {
    id: 'INSTAGRAM',
    name: 'Instagram',
    category: 'Visual & Media',
    description:
      'Publish high-resolution image carousels, standalone photos, and automated Instagram Reels via the official Meta Graph API.',
    capabilities: [
      'Reels Publishing',
      'Carousel Albums',
      'Hashtag Syndication',
      'Cover Customization',
    ],
    docsUrl: 'https://developers.facebook.com/docs/instagram-platform',
  },
  {
    id: 'YOUTUBE',
    name: 'YouTube',
    category: 'Video & Shorts',
    description:
      'Automate YouTube video uploads and 60-second vertical Shorts directly from Google Drive media sources with custom tags and descriptions.',
    capabilities: [
      'YouTube Shorts',
      'Long-form Video',
      'Custom Thumbnails',
      'Visibility Scheduling',
    ],
    docsUrl: 'https://developers.google.com/youtube/v3',
  },
];
