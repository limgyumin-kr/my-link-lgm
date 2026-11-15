import React from "react";
import {
  Bot,
  Code,
  FileText,
  BookOpen,
  MessageCircle,
  Database,
  Zap,
  Archive,
  Globe,
  Share2,
  Plus,
  Pencil,
  Trash2,
  Check,
  Copy,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Eye,
  EyeOff,
  Mail,
  X,
  Sliders,
  Info,
  Layers,
} from "lucide-react";
import { LinkCategory, SocialPlatform } from "@/types/link";

export function IconGithub({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export function IconLinkedin({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

export function IconYoutube({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M21.58 7.19a2.5 2.5 0 0 0-1.76-1.77C18.26 5 12 5 12 5s-6.26 0-7.82.42A2.5 2.5 0 0 0 2.42 7.19 26.07 26.07 0 0 0 2 12a26.07 26.07 0 0 0 .42 4.81 2.5 2.5 0 0 0 1.76 1.77C5.74 19 12 19 12 19s6.26 0 7.82-.42a2.5 2.5 0 0 0 1.76-1.77A26.07 26.07 0 0 0 22 12a26.07 26.07 0 0 0-.42-4.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
    </svg>
  );
}

export function IconInstagram({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

interface CategoryIconProps {
  category: LinkCategory | string;
  icon?: string;
  className?: string;
}

export function CategoryIcon({ category, icon, className = "w-4 h-4" }: CategoryIconProps) {
  if (icon) {
    switch (icon) {
      case "bot":
        return <Bot className={className} />;
      case "code":
        return <Code className={className} />;
      case "zap":
        return <Zap className={className} />;
      case "book-open":
        return <BookOpen className={className} />;
      case "file-text":
        return <FileText className={className} />;
      case "database":
        return <Database className={className} />;
      case "message-circle":
        return <MessageCircle className={className} />;
      case "archive":
        return <Archive className={className} />;
      case "globe":
        return <Globe className={className} />;
      case "layers":
        return <Layers className={className} />;
    }
  }

  switch (category) {
    case "PORTFOLIO":
      return <FileText className={className} />;
    case "WEBSITE":
      return <Globe className={className} />;
    case "ETC":
      return <Layers className={className} />;
    default:
      return <Globe className={className} />;
  }
}

interface SocialIconProps {
  platform: SocialPlatform | string;
  className?: string;
}

export function SocialIcon({ platform, className = "w-4 h-4" }: SocialIconProps) {
  switch (platform.toLowerCase()) {
    case "github":
      return <IconGithub className={className} />;
    case "mail":
      return <Mail className={className} />;
    case "linkedin":
      return <IconLinkedin className={className} />;
    case "youtube":
      return <IconYoutube className={className} />;
    case "instagram":
      return <IconInstagram className={className} />;
    default:
      return <Globe className={className} />;
  }
}

export {
  Share2,
  Plus,
  Pencil,
  Trash2,
  Check,
  Copy,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Eye,
  EyeOff,
  X,
  Sliders,
  Info,
  Layers,
};
