import { telegramClient } from "../telegram/telegram-client.js";
import { logger } from "../../lib/logger.js";

type ActivateMemberInput = {
  chatId: string;
  memberName: string;
};

export class MemberService {
  async activateMember(input: ActivateMemberInput) {
    const invite = await telegramClient.createInviteLink({
      chatId: input.chatId,
      memberName: input.memberName
    });

    logger.info(
      {
        chatId: input.chatId,
        memberName: input.memberName,
        inviteLink: invite.invite_link
      },
      "Member access released"
    );

    return invite;
  }
}

export const memberService = new MemberService();

