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
    const senderName = variables.senderName || "Naren Roy";
    const portfolioUrl = variables.portfolioUrl || "https://narenroy.in/";

    // 1. Natural Human Plain Text (no marketing links or localhost spam triggers)
    const bodyText = `${renderedBody}

-- 
${senderName}
${portfolioUrl}
${physicalAddress}

PS: If you prefer not to hear from me, simply reply with "stop" and I will remove you right away.`.trim();

    // Convert newlines in rendered body to clean <br> tags for native Gmail rendering
    const paragraphsHtml = renderedBody
      .split(/\n\n+/)
      .map((p) => `<p style="margin: 0 0 14px 0;">${this.escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
      .join("");

    // 2. Native Gmail HTML (formatted exactly like an email composed in Gmail web/mobile)
    const bodyHtml = `
<div dir="ltr" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #222222;">
  ${paragraphsHtml}
  <div style="margin-top: 20px; color: #333333;">
    <p style="margin: 0 0 2px 0;">--</p>
    <p style="margin: 0 0 2px 0;"><strong>${this.escapeHtml(senderName)}</strong></p>
    <p style="margin: 0 0 4px 0;"><a href="${portfolioUrl}" style="color: #1a73e8; text-decoration: none;">${portfolioUrl}</a></p>
    <p style="margin: 0 0 12px 0; font-size: 11px; color: #777777;">${this.escapeHtml(physicalAddress)}</p>
    <p style="margin: 0; font-size: 11px; color: #888888;">
      PS: If you prefer not to hear from me, simply reply with &quot;stop&quot; and I will remove you right away.
    </p>
  </div>
</div>
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
