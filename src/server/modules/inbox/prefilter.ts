import { InboxCategory } from "@prisma/client";

export interface PreFilterResult {
  shouldCallAi: boolean;
  classification?: InboxCategory;
  reason?: string;
  isOpportunity: boolean;
}

export function runDeterministicPreFilter(params: {
  senderEmail: string;
  subject: string;
  snippet: string;
  hasListUnsubscribeHeader: boolean;
  userEmail: string;
}): PreFilterResult {
  const { senderEmail, subject, snippet, hasListUnsubscribeHeader, userEmail } = params;
  const lowerSender = senderEmail.toLowerCase().trim();
  const lowerSubject = subject.toLowerCase().trim();
  const lowerSnippet = snippet.toLowerCase().trim();

  // 1. Own sent emails
  if (lowerSender === userEmail.toLowerCase().trim()) {
    return {
      shouldCallAi: false,
      classification: InboxCategory.NOT_RELEVANT,
      reason: "Sender is user's own account",
      isOpportunity: false,
    };
  }

  // 2. Automated notifications & no-reply senders
  if (
    lowerSender.includes("noreply") ||
    lowerSender.includes("no-reply") ||
    lowerSender.includes("donotreply") ||
    lowerSender.includes("notifications@") ||
    lowerSender.includes("mailer-daemon")
  ) {
    return {
      shouldCallAi: false,
      classification: InboxCategory.NOT_RELEVANT,
      reason: "Automated/no-reply sender",
      isOpportunity: false,
    };
  }

  // 3. Newsletters & Marketing with List-Unsubscribe
  if (hasListUnsubscribeHeader) {
    return {
      shouldCallAi: false,
      classification: InboxCategory.NOT_RELEVANT,
      reason: "Marketing newsletter with unsubscribe header",
      isOpportunity: false,
    };
  }

  // 4. Out of office / auto-responders
  if (
    lowerSubject.startsWith("out of office") ||
    lowerSubject.startsWith("automatic reply") ||
    lowerSubject.includes("auto-response") ||
    lowerSubject.includes("autoreply")
  ) {
    return {
      shouldCallAi: false,
      classification: InboxCategory.GENERAL,
      reason: "Out-of-office / automatic reply",
      isOpportunity: false,
    };
  }

  // 5. Bounces & delivery errors
  if (
    lowerSubject.includes("delivery status notification") ||
    lowerSubject.includes("undelivered mail") ||
    lowerSubject.includes("failure notice")
  ) {
    return {
      shouldCallAi: false,
      classification: InboxCategory.NOT_RELEVANT,
      reason: "Delivery status failure notice",
      isOpportunity: false,
    };
  }

  // 6. High-intent keyword heuristics (can pre-flag opportunities)
  const isFreelanceOrContract =
    lowerSubject.includes("freelance") ||
    lowerSubject.includes("contract") ||
    lowerSnippet.includes("freelance project") ||
    lowerSnippet.includes("hourly rate") ||
    lowerSnippet.includes("portfolio");

  const isWebsiteOrDevInquiry =
    lowerSubject.includes("website") ||
    lowerSubject.includes("redesign") ||
    lowerSubject.includes("quote") ||
    lowerSnippet.includes("develop an app") ||
    lowerSnippet.includes("build a website");

  if (isFreelanceOrContract) {
    return {
      shouldCallAi: true,
      classification: InboxCategory.FREELANCE_OPPORTUNITY,
      reason: "Subject mentions freelance/contract opportunity",
      isOpportunity: true,
    };
  }

  if (isWebsiteOrDevInquiry) {
    return {
      shouldCallAi: true,
      classification: InboxCategory.WEBSITE_INQUIRY,
      reason: "Inquiry regarding web design/software project",
      isOpportunity: true,
    };
  }

  // Default: pass to AI classification with structured JSON schema
  return {
    shouldCallAi: true,
    isOpportunity: false,
  };
}
