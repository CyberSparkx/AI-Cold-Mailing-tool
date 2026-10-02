import { describe, it, expect } from "vitest";
import { runDeterministicPreFilter } from "@/server/modules/inbox/prefilter";
import { InboxCategory } from "@prisma/client";

describe("Deterministic Inbox Pre-Filter", () => {
  const userEmail = "founder@startup.io";

  it("should drop own sent emails without calling AI", () => {
    const result = runDeterministicPreFilter({
      senderEmail: "founder@startup.io",
      subject: "Test email",
      snippet: "Just testing my sender",
      hasListUnsubscribeHeader: false,
      userEmail,
    });

    expect(result.shouldCallAi).toBe(false);
    expect(result.classification).toBe(InboxCategory.NOT_RELEVANT);
    expect(result.isOpportunity).toBe(false);
  });

  it("should drop no-reply, notifications, and mailer-daemon senders", () => {
    const senders = [
      "no-reply@github.com",
      "noreply@updates.stripe.com",
      "donotreply@bank.com",
      "notifications@slack.com",
      "mailer-daemon@googlemail.com",
    ];

    for (const senderEmail of senders) {
      const result = runDeterministicPreFilter({
        senderEmail,
        subject: "Your receipt or update",
        snippet: "Here is your invoice for May",
        hasListUnsubscribeHeader: false,
        userEmail,
      });

      expect(result.shouldCallAi).toBe(false);
      expect(result.classification).toBe(InboxCategory.NOT_RELEVANT);
    }
  });

  it("should drop newsletters having List-Unsubscribe header", () => {
    const result = runDeterministicPreFilter({
      senderEmail: "digest@techcrunch.com",
      subject: "Top stories in AI today",
      snippet: "Read our daily digest of tech news",
      hasListUnsubscribeHeader: true,
      userEmail,
    });

    expect(result.shouldCallAi).toBe(false);
    expect(result.classification).toBe(InboxCategory.NOT_RELEVANT);
  });

  it("should pass genuine incoming prospect emails to AI triage", () => {
    const result = runDeterministicPreFilter({
      senderEmail: "ceo@dentalclinic.com",
      subject: "Re: Quick question about modernizing your clinic website",
      snippet: "Hi Naren, saw your portfolio at narenroy.in and we would love a redesign quote.",
      hasListUnsubscribeHeader: false,
      userEmail,
    });

    expect(result.shouldCallAi).toBe(true);
  });
});
