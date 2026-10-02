import "server-only";
import { AppError } from "@/server/platform/errors/app-error";
import { generateUnsubscribeToken } from "@/server/platform/crypto/tokens";
import { env } from "@/server/platform/config/env";

export interface TemplateVariables {
  businessName?: string;
  category?: string;
  city?: string;
  location?: string;
  niche?: string;
  website?: string;
  senderName?: string;
  portfolioUrl?: string;
  personalizedOpening?: string;
}

export class TemplateService {
  validateTemplates(subject: string, body: string, isFollowUp = false) {
    if (!subject.trim()) {
      throw AppError.badRequest("Email subject template cannot be empty");
    }
    if (!body.trim()) {
      throw AppError.badRequest("Email body template cannot be empty");
    }

    // Anti-deception: Block fake "Re:" or "Fwd:" prefixes on first touches
    const trimmedSubject = subject.trim();
    if (!isFollowUp) {
      if (/^(re|fwd|fw):\s*/i.test(trimmedSubject)) {
        throw AppError.badRequest(
          "Deceptive subject line detected: Cold emails may not use fake 'Re:' or 'Fwd:' prefixes on first outreach."
        );
      }
    }
  }

  render(
    template: string,
    vars: TemplateVariables,
    fallbackValues: Record<string, string> = {
      businessName: "there",
      category: "your industry",
      city: "your area",
      location: "your area",
      niche: "your niche",
      website: "your website",
      portfolioUrl: "https://narenroy.in/",
      senderName: "Naren Roy",
      personalizedOpening: "",
    }
  ): string {
    return template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_match, key) => {
      const val = (vars as any)[key];
      if (val !== undefined && val !== null && String(val).trim().length > 0) {
        return String(val).trim();
      }
      return fallbackValues[key] || "";
    });
  }

  buildFullEmail(params: {
    userId: string;
    recipientEmail: string;
    campaignId: string;
    subjectTemplate: string;
    bodyTemplate: string;
    variables: TemplateVariables;
    postalAddress?: string;
  }): {
    subject: string;
    bodyText: string;
    bodyHtml: string;
    unsubscribeUrl: string;
  } {
    const { userId, recipientEmail, campaignId, subjectTemplate, bodyTemplate, variables, postalAddress } = params;

    const subject = this.render(subjectTemplate, variables);
    const renderedBody = this.render(bodyTemplate, variables);

    const token = generateUnsubscribeToken({
      userId,
      email: recipientEmail,
      campaignId,
    });

    const unsubscribeUrl = `${env.NEXT_PUBLIC_APP_URL}/unsubscribe/${token}`;
    const physicalAddress = postalAddress || "Kolkata, West Bengal, India";

    // Plain text version with footer
    const bodyText = `${renderedBody}

---
${variables.senderName || "Naren Roy"}
Portfolio: ${variables.portfolioUrl || "https://narenroy.in/"}
${physicalAddress}

Unsubscribe from outreach: ${unsubscribeUrl}`;

    // Clean, accessible HTML version
    const bodyHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto;">
    <div style="white-space: pre-wrap; margin-bottom: 24px;">${this.escapeHtml(renderedBody)}</div>
    
    <div style="border-top: 1px solid #eaeaea; padding-top: 16px; margin-top: 32px; font-size: 12px; color: #666666;">
      <p style="margin: 0 0 4px 0;"><strong>${this.escapeHtml(variables.senderName || "Naren Roy")}</strong></p>
      <p style="margin: 0 0 4px 0;"><a href="${variables.portfolioUrl || "https://narenroy.in/"}" style="color: #2563eb; text-decoration: underline;">${variables.portfolioUrl || "https://narenroy.in/"}</a></p>
      <p style="margin: 0 0 12px 0;">${this.escapeHtml(physicalAddress)}</p>
      <p style="margin: 0;">
        <a href="${unsubscribeUrl}" style="color: #888888; text-decoration: underline;">Click here to unsubscribe immediately</a>
      </p>
    </div>
  </div>
</body>
</html>
`.trim();

    return {
      subject,
      bodyText,
      bodyHtml,
      unsubscribeUrl,
    };
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

export const templateService = new TemplateService();
