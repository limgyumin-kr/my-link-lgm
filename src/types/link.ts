export type LinkCategory = "PORTFOLIO" | "WEBSITE" | "ETC";

export type SocialPlatform = "github" | "mail" | "instagram" | "youtube" | "linkedin";

export interface LinkItem {
  id: string;
  title: string;
  description?: string;
  url: string;
  category: LinkCategory;
  icon?: string;
  isActive: boolean;
  isFeatured?: boolean;
  order: number;
  clickCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  role: string;
  tags: string[];
}

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
  label: string;
}

export interface MockLinksResponseData {
  profile: UserProfile;
  socials: SocialLink[];
  links: LinkItem[];
  theme: {
    primaryColor: string;
    cardStyle: "flat" | "bordered" | "elevated";
  };
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  status: "success" | "error";
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}
