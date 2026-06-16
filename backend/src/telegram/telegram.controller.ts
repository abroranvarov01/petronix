import { Controller, Post, Body, InternalServerErrorException } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';

@Controller()
export class TelegramController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post('send-message')
  async sendMessage(@Body() body: { name: string; phone: string; email: string }) {
    const text = `🚀 *Yangi ariza*\n👤 *Ism:* ${body.name}\n📞 *Telefon:* ${body.phone}\n📧 *Email:* ${body.email}`;
    const ok = await this.notifications.send(text);
    if (!ok) throw new InternalServerErrorException('Telegram API xatosi');
    return { success: true };
  }

  @Post('order')
  async order(@Body() body: { name: string; brand: string; type: string; id: string }) {
    const text = `🔥 *Yangi buyurtma so'rovi!*\n\n📦 *Mahsulot:* ${body.name}\n🏷 *Brend:* ${body.brand}\n⚙️ *Turi:* ${body.type}\n🆔 *ID:* ${body.id}\n\nMijoz ushbu mahsulotga qiziqish bildirdi.`;
    const ok = await this.notifications.send(text);
    if (!ok) throw new InternalServerErrorException('Telegram API xatosi');
    return { success: true };
  }
}
