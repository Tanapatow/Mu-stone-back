export class JoinChatDto {
  userId?: string;
}

export class SendMessageDto {
  roomId: string;
  content: string;
}

export class MarkReadDto {
  roomId: string;
}
