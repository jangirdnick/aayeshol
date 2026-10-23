export type SupportedPlatformId = 'LINKEDIN' | 'X_TWITTER' | 'INSTAGRAM' | 'YOUTUBE';

export interface ConnectedProfileData {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  avatar: string | null;
  profileUrl: string | null;
  connectedAt: string | Date;
}

export interface SocialPlatformConfig {
  id: SupportedPlatformId;
  name: string;
  category: string;
  description: string;
  capabilities: string[];
  docsUrl?: string;
  account?: ConnectedProfileData | null;
  isConnecting?: boolean;
}

export type FilterStatus = 'ALL' | 'CONNECTED' | 'DISCONNECTED';
