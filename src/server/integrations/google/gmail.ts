import "server-only";
import { google } from "googleapis";
import { getValidGoogleClient } from "./token-store";
import { GoogleService } from "@prisma/client";
import crypto from "crypto";
import { AppError } from "@/server/platform/errors/app-error";
import { ERROR_CODES } from "@/server/platform/errors/error-codes";
import { logger } from "@/server/platform/logger/logger";

export interface SendEmailParams {
  userId: string;
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  unsubscribeUrl: string;
  senderName?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  providerMessageId: string;
  threadId: string;
  rfcMessageId: string;
}

export class GmailSendingService {
  private async getGmailClient(userId: string) {
    const { oauth2Client, senderEmail } = await getValidGoogleClient(userId, GoogleService.GMAIL_SEND);
    return {
      gmail: google.gmail({ version: "v1", auth: oauth2Client }),
      senderEmail,
    };
  }

  buildMimeMessage(params: {
    from: string;
    to: string;
    subject: string;
    bodyText: string;
    bodyHtml: string;
    rfcMessageId: string;
    unsubscribeUrl: string;
    replyTo?: string;
  }): string {
    const { from, to, subject, bodyText, bodyHtml, rfcMessageId, unsubscribeUrl, replyTo } = params;
    const boundary = `boundary_${crypto.randomBytes(16).toString("hex")}`;

    // RFC 2822 formatted raw message with List-Unsubscribe headers
    const headers = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: =?utf-8?B?${Buffer.from(subject).toString("base64")}?=`,
      `Message-ID: ${rfcMessageId}`,
      `Date: ${new Date().toUTCString()}`,
      `MIME-Version: 1.0`,
      `List-Unsubscribe: <${unsubscribeUrl}>`,
      `List-Unsubscribe-Post: List-Unsubscribe=One-Click`,
      ...(replyTo ? [`Reply-To: ${replyTo}`] : []),
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ];

    const messageParts = [
      headers.join("\r\n"),
      "",
      `--${boundary}`,
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      Buffer.from(bodyText).toString("base64"),
      "",
      `--${boundary}`,
      "Content-Type: text/html; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      Buffer.from(bodyHtml).toString("base64"),
      "",
      `--${boundary}--`,
    ];

    const raw = messageParts.join("\r\n");
    // Gmail API requires base64url encoding without padding
    return Buffer.from(raw).toString("base64url");
  }

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    const { userId, to, subject, bodyText, bodyHtml, unsubscribeUrl, senderName, replyTo } = params;
    const { gmail, senderEmail } = await this.getGmailClient(userId);

    const fromHeader = senderName ? `"${senderName}" <${senderEmail}>` : senderEmail;
    const rfcMessageId = `<outreach-${crypto.randomUUID()}@${senderEmail.split("@")[1] || "gmail.com"}>`;

    const rawMessage = this.buildMimeMessage({
      from: fromHeader,
      to,
      subject,
      bodyText,
      bodyHtml,
      rfcMessageId,
      unsubscribeUrl,
      replyTo,
    });

    try {
      logger.info({ userId, to, rfcMessageId }, "Dispatching message via Gmail API");

      const response = await gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw: rawMessage,
        },
      });

      const providerMessageId = response.data.id;
      const threadId = response.data.threadId;

      if (!providerMessageId) {
        throw new Error("Gmail API did not return a message ID");
      }

      return {
        providerMessageId,
        threadId: threadId || providerMessageId,
        rfcMessageId,
      };
    } catch (err: any) {
      logger.error({ err, userId, to }, "Failed to send email via Gmail API");
      const isRateLimit = err.code === 429 || err.status === 429 || (err.message && err.message.includes("quota"));

      throw new AppError({
        message: err.message || "Failed to deliver message via Gmail API",
        code: isRateLimit ? ERROR_CODES.RATE_LIMITED : ERROR_CODES.GMAIL_API_ERROR,
        statusCode: isRateLimit ? 429 : 502,
        details: err,
        isOperational: true,
      });
    }
  }
}

export const gmailSendingService = new GmailSendingService();
