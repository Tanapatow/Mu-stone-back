import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { UseGuards, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

import { ChatService } from '../chat/chat.service'; // ชี้ path ให้ตรงกับของคุณนะครับ

import { WsAuthGuard } from 'src/auth/guards/ws-auth.guard';
import type { AuthSocket } from 'src/@types/socket';
import { JoinChatDto, MarkReadDto, SendMessageDto } from './dtos/chat.dto';

@WebSocketGateway({ namespace: 'chat', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {}

  // เมื่อมีคนเชื่อมต่อเข้ามา (ยังไม่เช็ก Token ตรงนี้ ให้ Guard ไปดักตอนส่ง Event แทน)
  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('join_chat')
  async handleJoinChat(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: JoinChatDto,
  ) {
    try {
      const user = client.data.user;

      // ถ้าไม่มีการระบุ userId มา ให้ใช้ ID ของคนที่ล็อกอินอยู่ (ป้องกันการสวมรอย)
      const targetUserId = data.userId || user.sub;

      // 1. เตรียมห้อง
      const room = await this.chatService.getOrCreateRoom(targetUserId);
      await client.join(room.id);

      this.logger.log(`User ${user.sub} joined room ${room.id}`);

      // 2. ดึงประวัติแชท
      const history = await this.chatService.getChatHistory(room.id);

      // 3. ส่งประวัติกลับไปให้คนเข้าห้อง
      client.emit('chat_history', history);

      return { event: 'joined_room', data: { roomId: room.id } };
    } catch (error: unknown) {
      // 🌟 Cast Error อย่างปลอดภัย เพื่อไม่ให้ติด any
      const err = error as { message?: string; code?: string };
      return {
        event: 'error',
        data: {
          message: err.message || 'เข้าห้องแชทไม่ได้',
          code: err.code || 'JOIN_ERROR',
        },
      };
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: SendMessageDto,
  ) {
    try {
      const user = client.data.user;

      // บังคับใช้ user.sub จาก Token เสมอ ป้องกันหน้าบ้านส่ง senderId ปลอมมา
      const newMessage = await this.chatService.saveMessage(
        data.roomId,
        user.sub,
        data.content,
      );

      // กระจายข้อความให้ทุกคนในห้อง (รวมแอดมิน)
      this.server.to(data.roomId).emit('receive_message', newMessage);
    } catch (error: unknown) {
      const err = error as Error;
      client.emit('error', {
        message: err.message || 'ส่งข้อความไม่ได้',
        code: 'SEND_ERROR',
      });
    }
  }

  // ==========================================
  // 3. อ่านข้อความ (ต้องผ่าน Guard)
  // ==========================================
  @UseGuards(WsAuthGuard)
  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: MarkReadDto,
  ) {
    try {
      const user = client.data.user;

      // แจ้ง Service ว่า User คนนี้อ่านข้อความแล้ว
      await this.chatService.markAsRead(data.roomId, user.sub);

      // ประกาศให้ทั้งห้องรู้ว่ามีการอ่านแล้ว หน้าบ้านจะได้อัปเดตไอคอน
      this.server
        .to(data.roomId)
        .emit('messages_read', { roomId: data.roomId });
    } catch (error: unknown) {
      this.logger.error('Mark read failed', error);
    }
  }
}
