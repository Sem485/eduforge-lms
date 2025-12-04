
export enum UserRole {
  ADMIN = 'ADMIN',
  INSTRUCTOR = 'INSTRUCTOR',
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  fullName: string;
  createdAt: string;
}

export interface AuthSession {
  token: string;
  userId: string;
  expiresAt: number;
}

export enum BlockType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
  VIDEO_LINK = 'VIDEO_LINK',
  PDF_LINK = 'PDF_LINK',
  NOTE = 'NOTE',
  // New Types
  QUOTE = 'QUOTE',
  DIVIDER = 'DIVIDER',
  LIST = 'LIST',
  CALLOUT = 'CALLOUT'
}

export interface BlockStyle {
  color?: string; // For callouts or text
  align?: 'left' | 'center' | 'right';
  listType?: 'bullet' | 'number';
}

export interface LessonBlock {
  id: string;
  type: BlockType;
  content: string; // Text content or URL
  metadata?: {
    caption?: string;
    style?: BlockStyle;
    variant?: 'info' | 'warning' | 'success' | 'tip';
    items?: string[]; // For lists if content isn't sufficient
  };
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  order: number;
  blocks: LessonBlock[];
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  order: number;
}

export interface Course {
  id: string;
  authorId: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LogEntry {
  id: string;
  userId: string;
  username: string;
  action: string;
  resourceId?: string;
  details: string;
  timestamp: string;
  ip: string;
}

export interface ResourceFolder {
  id: string;
  parentId: string | null;
  ownerId: string;
  name: string;
  path: string;
  createdAt: string;
}

export interface ResourceFile {
  id: string;
  uploaderId: string;
  parentId: string | null;
  name: string;
  type: string;
  size: number;
  url: string;
  usageReferences: string[];
  createdAt: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface ViewerSettings {
  theme: 'light' | 'dark' | 'sepia';
  fontSize: 'small' | 'medium' | 'large' | 'huge';
  showBlocks: boolean;
}

export type NotificationType = 'success' | 'error' | 'info';
