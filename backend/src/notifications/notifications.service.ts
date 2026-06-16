import { Injectable, Logger } from '@nestjs/common';

/**
 * Single place that talks to Telegram. Callers pass ready Markdown text.
 * `send` never throws — it returns whether the message was delivered, so
 * background callers (orders, low-stock) can ignore the result safely.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger('NotificationsService');

  async send(text: string): Promise<boolean> {
    const botToken = process.env.BOT_TOKEN ?? process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.ADMIN_CHAT_ID ?? process.env.TELEGRAM_CHAT_ID;
    if (!botToken || !chatId) {
      this.logger.warn('Telegram not configured — notification skipped');
      return false;
    }
    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
      });
      if (!res.ok) {
        this.logger.warn(`Telegram send failed: HTTP ${res.status}`);
        return false;
      }
      return true;
    } catch (e) {
      this.logger.warn(`Telegram error: ${(e as Error).message}`);
      return false;
    }
  }
}
