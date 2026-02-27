export interface NotificationResponseDto {
  publicId: string;
  title?: string;
  mensaje: string;
  unread: boolean;
  creationDate: string;
  type: string;
  linkUrl?: string;
}