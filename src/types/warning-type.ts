
export enum WarningStatus {
  WARNING = 'WARNING',
  ALERT = 'ALERT',
  NORMAL = 'NORMAL',
}

export interface Warning  {
  active: boolean
  name: string
  rtspUrl: string
  geocode: number[]
  note: string
  status: WarningStatus
  files: string[]
  httpUrl: string
  rtsUrl: string
  userNameDevice: string
  passwordDevice: string
}
