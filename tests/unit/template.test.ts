import { describe, it, expect } from "vitest";
import { TemplateService } from "@/server/modules/campaigns/template.service";
import { AppError } from "@/server/platform/errors/app-error";

describe("Cold Email Template Engine", () => {
  const templateService = new TemplateService();

  it("should interpolate all recognized variables into template string", () => {
    const template = "Hi {{businessName}}, noticed your website at {{website}} in {{city}}.";
    const vars = {
      businessName: "Acme Dental",
      website: "https://acmedental.com",
      city: "Austin",
    };

    const rendered = templateService.render(template, vars);
    expect(rendered).toBe("Hi Acme Dental, noticed your website at https://acmedental.com in Austin.");
  });

  it("should apply graceful fallbacks for missing template variables", () => {
    const template = "Hello {{businessName}}, we help businesses in {{city}}.";
    const vars = {};

    const rendered = templateService.render(template, vars);
    expect(rendered).toBe("Hello there, we help businesses in your area.");
  });

  it("should reject deceptive 'Re:' and 'Fwd:' subject lines on cold first touch", () => {
    expect(() => {
      templateService.validateTemplates("Re: Follow up on our meeting", "Body content", false);
    }).toThrowError(AppError);

    expect(() => {
      templateService.validateTemplates("Fwd: Urgent project details", "Body content", false);
    }).toThrowError(AppError);
  });

  it("should allow follow-up subjects to contain 'Re:'", () => {
    expect(() => {
      templateService.validateTemplates("Re: Quick follow up regarding web design", "Body content", true);
    }).not.toThrow();
  });

  it("should generate CAN-SPAM compliant footer with address and unsubscribe link", () => {
    const fullEmail = templateService.buildFullEmail({
      userId: "650000000000000000000001",
      recipientEmail: "test@company.com",
      campaignId: "650000000000000000000002",
      subjectTemplate: "Quick question for {{businessName}}",
      bodyTemplate: "Would you be open to a 10-minute chat this Thursday?",
      variables: { businessName: "Acme Corp" },
      postalAddress: "123 Market St, Suite 400, San Francisco, CA 94105",
    });

    expect(fullEmail.subject).toBe("Quick question for Acme Corp");
    expect(fullEmail.bodyText).toContain("Would you be open to a 10-minute chat this Thursday?");
    expect(fullEmail.bodyText).toContain("123 Market St, Suite 400, San Francisco, CA 94105");
    expect(fullEmail.bodyText).toContain("Unsubscribe from outreach:");
    expect(fullEmail.bodyHtml).toContain("Click here to unsubscribe immediately");
    expect(fullEmail.unsubscribeUrl).toBeDefined();
  });
});
