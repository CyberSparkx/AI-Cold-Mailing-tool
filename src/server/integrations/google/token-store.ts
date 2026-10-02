import { google } from "googleapis";
import { prisma } from "@/server/platform/db/prisma";
import { encrypt, decrypt } from "@/server/platform/crypto/encrypt";
import { getOAuth2Client, GOOGLE_SCOPES } from "./oauth";
import { GoogleService } from "@prisma/client";
import { AppError } from "@/server/platform/errors/app-error";
import { ERROR_CODES } from "@/server/platform/errors/error-codes";
import { logger } from "@/server/platform/logger/logger";

export async function storeGoogleTokens(params: {
  userId: string;
  providerAccountId: string;
  email: string;
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  scopes: string[];
  service: GoogleService;
}) {
  const { userId, providerAccountId, email, accessToken, refreshToken, expiresIn, scopes, service } = params;

  const accessTokenEnc = encrypt(accessToken);
  const refreshTokenEnc = refreshToken ? encrypt(refreshToken) : undefined;
  const accessTokenExpiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : undefined;

  const existing = await prisma.googleAccount.findFirst({
    where: { userId, providerAccountId },
  });

  const allScopes = Array.from(new Set([...(existing?.scopes || []), ...scopes]));
  
  const allServices: GoogleService[] = [];
  if (allScopes.includes(GOOGLE_SCOPES.SHEETS)) allServices.push(GoogleService.SHEETS);
  if (allScopes.includes(GOOGLE_SCOPES.GMAIL_SEND)) allServices.push(GoogleService.GMAIL_SEND);
  if (allScopes.includes(GOOGLE_SCOPES.GMAIL_READ)) allServices.push(GoogleService.GMAIL_READ);
  // Also include the requested service if specified
  if (service && !allServices.includes(service) && scopes.length === 0) {
    allServices.push(service);
  }

  return prisma.googleAccount.upsert({
    where: {
      userId_providerAccountId: {
        userId,
        providerAccountId,
      },
    },
    update: {
      email,
      accessTokenEnc,
      ...(refreshTokenEnc && { refreshTokenEnc }),
      accessTokenExpiresAt,
      scopes: allScopes,
      services: allServices,
      status: "ACTIVE",
      lastRefreshError: null,
    },
    create: {
      userId,
      providerAccountId,
      email,
      accessTokenEnc,
      refreshTokenEnc,
      accessTokenExpiresAt,
      scopes: allScopes,
      services: allServices,
      status: "ACTIVE",
    },
  });
}

export async function getValidGoogleClient(userId: string, requiredService: GoogleService) {
  const account = await prisma.googleAccount.findFirst({
    where: {
      userId,
      services: { has: requiredService },
      status: "ACTIVE",
    },
  });

  if (!account || !account.refreshTokenEnc) {
    throw new AppError({
      message: `Google ${requiredService} access is not connected. Please connect in Settings -> Google Connections.`,
      code: ERROR_CODES.GOOGLE_NOT_CONNECTED,
      statusCode: 400,
    });
  }

  const oauth2Client = getOAuth2Client();
  const refreshToken = decrypt(account.refreshTokenEnc);
  let accessToken = account.accessTokenEnc ? decrypt(account.accessTokenEnc) : "";

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
    access_token: accessToken,
  });

  // Check if access token is expired or expiring in next 60 seconds
  const isExpired = account.accessTokenExpiresAt
    ? account.accessTokenExpiresAt.getTime() - Date.now() < 60000
    : true;

  if (isExpired) {
    try {
      logger.info({ userId, service: requiredService }, "Refreshing Google access token");
      const { credentials } = await oauth2Client.refreshAccessToken();

      accessToken = credentials.access_token || accessToken;
      const newExpiresAt = credentials.expiry_date ? new Date(credentials.expiry_date) : undefined;

      await prisma.googleAccount.update({
        where: { id: account.id },
        data: {
          accessTokenEnc: encrypt(accessToken),
          accessTokenExpiresAt: newExpiresAt,
          lastRefreshError: null,
        },
      });

      oauth2Client.setCredentials(credentials);
    } catch (err: any) {
      logger.error({ err, userId }, "Failed to refresh Google access token");
      await prisma.googleAccount.update({
        where: { id: account.id },
        data: {
          status: "NEEDS_REAUTH",
          lastRefreshError: err.message || "Failed to refresh token",
        },
      });
      throw new AppError({
        message: "Google connection token has expired or been revoked. Please reconnect in Settings.",
        code: ERROR_CODES.GOOGLE_TOKEN_REVOKED,
        statusCode: 401,
      });
    }
  }

  return {
    oauth2Client,
    senderEmail: account.email,
  };
}

export async function getGoogleConnectionStatus(userId: string) {
  const accounts = await prisma.googleAccount.findMany({
    where: { userId },
  });

  const activeAccount = accounts[0];

  return {
    connected: Boolean(activeAccount),
    email: activeAccount?.email || null,
    status: activeAccount?.status || "NOT_CONNECTED",
    services: {
      sheets: Boolean(activeAccount?.services.includes(GoogleService.SHEETS)),
      gmailSend: Boolean(activeAccount?.services.includes(GoogleService.GMAIL_SEND)),
      gmailRead: Boolean(activeAccount?.services.includes(GoogleService.GMAIL_READ)),
    },
  };
}
