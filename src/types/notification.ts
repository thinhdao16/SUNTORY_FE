// Notification types enum
export enum NotificationType {
  CHAT_MESSAGE = "CHAT_MESSAGE",
  GROUP_CHAT_CREATED = "GROUP_CHAT_CREATED",
  GROUP_CHAT_UPDATED = "GROUP_CHAT_UPDATED",
  GROUP_CHAT_KICKED = "GROUP_CHAT_KICKED",
  MEMBER_ADDED_TO_GROUP = "MEMBER_ADDED_TO_GROUP",
  GROUP_MEMBERS_ADDED = "GROUP_MEMBERS_ADDED",
  GROUP_CHAT_REMOVED = "GROUP_CHAT_REMOVED",
  MEMBER_REMOVED_FROM_GROUP = "MEMBER_REMOVED_FROM_GROUP",
  GROUP_MEMBERS_REMOVED = "GROUP_MEMBERS_REMOVED",
  FRIEND_REQUEST = "FRIEND_REQUEST",
  FRIEND_REQUEST_ACCEPTED = "FRIEND_REQUEST_ACCEPTED",
  LIKED_POST = "LIKED_POST",
  COMMENTED_POST = "COMMENTED_POST",
  REPOSTED_POST = "REPOSTED_POST",
  SHARED_POST = "SHARED_POST",
  COMMENT_LIKED_POST = "COMMENT_LIKED_POST",
  REPLY_COMMENT_POST = "REPLY_COMMENT_POST"
}

// Helper function to check if notification type is chat-related
export const isChatNotification = (type: string): boolean => {
  return [
    NotificationType.CHAT_MESSAGE,
    NotificationType.GROUP_CHAT_CREATED,
    NotificationType.GROUP_CHAT_UPDATED,
    NotificationType.GROUP_CHAT_KICKED,
    NotificationType.MEMBER_ADDED_TO_GROUP,
    NotificationType.GROUP_MEMBERS_ADDED,
    NotificationType.GROUP_CHAT_REMOVED,
    NotificationType.MEMBER_REMOVED_FROM_GROUP,
    NotificationType.GROUP_MEMBERS_REMOVED,
  ].includes(type as NotificationType);
};

// Helper function to check if notification type is friend-related
export const isFriendNotification = (type: string): boolean => {
  return [
    NotificationType.FRIEND_REQUEST,
    NotificationType.FRIEND_REQUEST_ACCEPTED,
  ].includes(type as NotificationType);
};

export const isStoryNotification = (type: string): boolean => {
  return [
    NotificationType.LIKED_POST,
    NotificationType.COMMENTED_POST,
    NotificationType.REPOSTED_POST,
    NotificationType.SHARED_POST,
    NotificationType.COMMENT_LIKED_POST,
    NotificationType.REPLY_COMMENT_POST,
  ].includes(type as NotificationType);
};
