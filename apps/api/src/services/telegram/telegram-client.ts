import { IntegrationError } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";
import { env } from "../../config/env.js";

type CreateInviteLinkInput = {
  chatId: string;
  memberName: string;
  expireDate?: number;
};

export class TelegramClient {
  private readonly baseUrl = env.TELEGRAM_BOT_TOKEN
    ? `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`
    : "";

  async createInviteLink(input: CreateInviteLinkInput) {
    if (!env.TELEGRAM_BOT_TOKEN) {
      logger.warn("Telegram bot token not configured; returning mocked invite link");

      return {
        invite_link: `https://t.me/+${crypto.randomUUID().slice(0, 12)}`,
        creates_join_request: true,
        name: input.memberName
      };
    }

    const response = await fetch(`${this.baseUrl}/createChatInviteLink`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: input.chatId,
        name: `Acesso ${input.memberName}`,
        member_limit: 1,
        expire_date: input.expireDate,
        creates_join_request: true
      })
    });

    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      throw new IntegrationError("Failed to create Telegram invite link", {
        status: response.status,
        payload
      });
    }

    return payload.result;
  }

  async getMe(token: string) {
    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      throw new IntegrationError("Failed to validate Telegram bot", {
        status: response.status,
        payload
      });
    }

    return payload.result;
  }

  async sendMessage(token: string, chatId: string, text: string) {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text
      })
    });

    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      throw new IntegrationError("Failed to send Telegram test message", {
        status: response.status,
        payload
      });
    }

    return payload.result;
  }
}

export const telegramClient = new TelegramClient();
