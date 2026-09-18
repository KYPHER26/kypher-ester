export type Mood = 'happy' | 'loved' | 'moved' | 'funny' | 'flat' | 'tired';

export const MOOD_EMOJI: Record<Mood, string> = {
  happy: '😊',
  loved: '😍',
  moved: '🥹',
  funny: '😂',
  flat: '😐',
  tired: '😴',
};

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  profilePhoto?: string;
  coupleId?: string;
  createdAt: number;
}

export interface Couple {
  coupleId: string;
  partner1Id: string;
  partner2Id: string;
  relationshipStartDate: string;
  anniversaryDate?: string;
  quote?: string;
  createdAt: number;
}

export interface Memory {
  memoryId: string;
  coupleId: string;
  authorId: string;
  date: string;
  title: string;
  whatIDid?: string;
  howMyDayWent?: string;
  forPartner?: string;
  content?: string;
  mood?: Mood;
  location?: string;
  tags: string[];
  photoIds: string[];
  isSpecial: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Photo {
  photoId: string;
  coupleId: string;
  uploaderId: string;
  memoryId?: string;
  storagePath: string;
  downloadUrl: string;
  caption?: string;
  createdAt: number;
}

export interface Comment {
  commentId: string;
  memoryId: string;
  coupleId: string;
  authorId: string;
  content: string;
  createdAt: number;
}

export type ReactionType = 'love' | 'adore' | 'moved' | 'laugh' | 'like';

export const REACTION_EMOJI: Record<ReactionType, string> = {
  love: '❤️',
  adore: '😍',
  moved: '🥹',
  laugh: '😂',
  like: '👍',
};

export interface Reaction {
  reactionId: string;
  memoryId: string;
  coupleId: string;
  userId: string;
  reactionType: ReactionType;
  createdAt: number;
}

export type NotificationType =
  | 'new_memory'
  | 'new_photo'
  | 'new_comment'
  | 'new_reaction'
  | 'anniversary_soon';

export interface AppNotification {
  notificationId: string;
  coupleId: string;
  recipientId: string;
  senderId: string;
  type: NotificationType;
  referenceId: string;
  read: boolean;
  createdAt: number;
}

export interface Milestone {
  milestoneId: string;
  coupleId: string;
  title: string;
  date: string;
  icon?: string;
  description?: string;
  createdAt: number;
}
