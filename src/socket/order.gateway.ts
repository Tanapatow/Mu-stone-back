import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

// 🌟 เปิดรับการเชื่อมต่อจากหน้าบ้าน (Frontend) ทุกโดเมน
@WebSocketGateway({ cors: { origin: '*' } })
export class OrderGateway implements OnGatewayConnection, OnGatewayDisconnect {
  // ตัวแปร server นี้คือตัวจัดการ Socket ทั้งหมด
  @WebSocketServer()
  server: Server;

  // 🔌 ฟังก์ชันนี้ทำงานอัตโนมัติเมื่อมีคนเปิดหน้าเว็บแล้วเชื่อมต่อเข้ามา
  handleConnection(client: Socket) {
    console.log(`🟢 ลูกค้าเชื่อมต่อเข้ามาแล้ว: ${client.id}`);
  }

  // 🔌 ฟังก์ชันนี้ทำงานอัตโนมัติเมื่อลูกค้าปิดหน้าเว็บ
  handleDisconnect(client: Socket) {
    console.log(`🔴 ลูกค้าปิดหน้าเว็บไปแล้ว: ${client.id}`);
  }

  // =========================================================
  // 🚪 1. ให้ Frontend ขอเข้า "ห้องส่วนตัว" ของแต่ละบิล
  // =========================================================
  @SubscribeMessage('join_order_room')
  async handleJoinOrderRoom(
    @MessageBody() orderId: string, // รับรหัสบิลจากหน้าบ้าน
    @ConnectedSocket() client: Socket,
  ) {
    // จับลูกค้าโยนเข้าห้องชื่อ order_ตามด้วยรหัสบิล
    await client.join(`order_${orderId}`);
    console.log(`👤 ลูกค้า ${client.id} เข้าห้องรอฟังบิล: ${orderId}`);

    // ตอบกลับไปขำๆ ว่าเข้าห้องสำเร็จ
    return { event: 'joined', data: `เข้าห้องบิล ${orderId} สำเร็จ` };
  }

  // =========================================================
  // 📢 2. ฟังก์ชันประกาศข่าว (Service อื่นๆ จะมาเรียกใช้ตัวนี้)
  // =========================================================
  notifyOrderStatusUpdate(orderId: string, status: string) {
    this.server.to(`order_${orderId}`).emit('order_status_updated', {
      orderId: orderId,
      status: status,
      message:
        status === 'PAID' ? 'ชำระเงินเรียบร้อยแล้ว!' : 'สถานะมีการเปลี่ยนแปลง',
    });
    console.log(`📢 ประกาศ: บิล ${orderId} เปลี่ยนสถานะเป็น ${status} แล้ว!`);
  }
}
