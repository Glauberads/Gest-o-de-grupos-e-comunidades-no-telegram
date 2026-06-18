import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";

export function useTelegramBotStatus(organizationId?: string) {
  const [telegramBot, setTelegramBot] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    let active = true;

    apiRequest<{ telegramBot: any }>(`/api/telegram/bot/status?organizationId=${organizationId}`)
      .then((payload) => {
        if (active) {
          setTelegramBot(payload.telegramBot);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [organizationId]);

  return {
    telegramBot,
    loading
  };
}
