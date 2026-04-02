import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateRoom(userId: string) {
    try {
      let room = await this.prisma.chatRoom.findFirst({
        where: { userId, status: 'OPEN' },
      });

      if (!room) {
        room = await this.prisma.chatRoom.create({
          data: { userId, status: 'OPEN' },
        });
      }
      return room;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(`[getOrCreateRoom] Error: ${errorMessage}`);
      throw new InternalServerErrorException({
        message: 'ไม่สามารถจัดเตรียมห้องแชทได้ กรุณาลองใหม่อีกครั้ง',
        code: 'CHAT_ROOM_INIT_FAILED',
      });
    }
  }

  async saveMessage(roomId: string, senderId: string, content: string) {
    try {
      const room = await this.prisma.chatRoom.findUnique({
        where: { id: roomId },
      });

      if (!room) {
        throw new NotFoundException({
          message: 'ไม่พบห้องแชทที่ระบุ',
          code: 'CHAT_ROOM_NOT_FOUND',
        });
      }

      const newMessage = await this.prisma.message.create({
        data: {
          content,
          roomId,
          senderId,
        },
        include: {
          sender: { select: { firstName: true, lastName: true, role: true } },
        },
      });

      return newMessage;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(`[saveMessage] Error: ${errorMessage}`);
      throw new InternalServerErrorException({
        message: 'ส่งข้อความไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
        code: 'MESSAGE_SAVE_FAILED',
      });
    }
  }

  // ==========================================
  // 3. ดึงประวัติแชท (สำหรับโหลดหน้าแชทครั้งแรก)
  // ==========================================
  async getChatHistory(roomId: string) {
    try {
      return await this.prisma.message.findMany({
        where: { roomId },
        orderBy: { createdAt: 'asc' },
        include: {
          sender: { select: { firstName: true, lastName: true, role: true } },
        },
        take: 100, // ดึงมาแค่ 100 ข้อความล่าสุดก่อน
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`[getChatHistory] Error: ${errorMessage}`);
      throw new InternalServerErrorException({
        message: 'โหลดประวัติการแชทล้มเหลว',
        code: 'CHAT_HISTORY_LOAD_FAILED',
      });
    }
  }

  async getAdminRooms() {
    try {
      return await this.prisma.chatRoom.findMany({
        orderBy: { updatedAt: 'desc' }, // ห้องที่มีความเคลื่อนไหวล่าสุดอยู่บน
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' }, // เอาข้อความล่าสุดมาโชว์ Preview
          },
          _count: {
            select: { messages: { where: { isRead: false } } }, // นับจำนวนที่ยังไม่ได้อ่าน
          },
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`[getAdminRooms] Error: ${errorMessage}`);
      throw new InternalServerErrorException({
        message: 'ไม่สามารถโหลดรายการห้องแชทสำหรับแอดมินได้',
        code: 'ADMIN_ROOMS_LOAD_FAILED',
      });
    }
  }

  async markAsRead(roomId: string, userId: string) {
    try {
      await this.prisma.message.updateMany({
        where: {
          roomId,
          senderId: { not: userId }, // อ่านเฉพาะข้อความที่คนอื่นส่งมา
          isRead: false,
        },
        data: { isRead: true },
      });
      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`[markAsRead] Error: ${errorMessage}`);
      throw new InternalServerErrorException({
        message: 'ไม่สามารถอัปเดตสถานะการอ่านได้',
        code: 'MARK_READ_FAILED',
      });
    }
  }
}
