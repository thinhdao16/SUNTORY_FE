export const ShareLogType = {
  UserChat: 10,
  GroupChat: 20,
  Social: 30,
} as const;

export type ShareLogTypeValue = typeof ShareLogType[keyof typeof ShareLogType];
