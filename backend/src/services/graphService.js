<<<<<<< HEAD

=======
>>>>>>> 3b17f96fb1b5f31fa77d605edb9238421868e52d
require("isomorphic-fetch");

const {
    ConfidentialClientApplication
} = require("@azure/msal-node");

const graph = require("@microsoft/microsoft-graph-client");

const msalConfig = {
    auth: {
        clientId: process.env.CLIENT_ID,
        authority: "https://login.microsoftonline.com/common",
        clientSecret: process.env.CLIENT_SECRET
    }
};

const cca = new ConfidentialClientApplication(msalConfig);

// Common Graph scopes used throughout the CRM
const SCOPES = [
    "User.Read",

    // Email
    "Mail.Read",
    "Mail.ReadWrite",
    "Mail.Send",

    // Calendar
    "Calendars.Read",
    "Calendars.ReadWrite",

 

    // Refresh Token
    "offline_access"
];

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function getAuthUrl(state) {
    return cca.getAuthCodeUrl({
        scopes: SCOPES,
        redirectUri: process.env.REDIRECT_URI,
        state: state || ""
    });
}

async function getTokenFromCode(code) {
    const response = await cca.acquireTokenByCode({
        code,
        scopes: SCOPES,
        redirectUri: process.env.REDIRECT_URI
    });
    return response;
}

async function refreshAccessToken(refreshToken) {
    const response = await cca.acquireTokenByRefreshToken({
        refreshToken,
        scopes: SCOPES
    });
    return response;
}

function getGraphClient(accessToken) {
    return graph.Client.init({
        authProvider: (done) => {
            done(null, accessToken);
        }
    });
}

function isTokenExpired(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return true;
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        const exp = payload.exp;
        if (!exp) return true;
        return (Date.now() / 1000) > (exp - 300); // 5 minute buffer
    } catch (err) {
        return true;
    }
}

/**
 * Robustly retrieves valid Outlook tokens for a request.
 * Prioritizes DB (to allow automated token refreshes), and falls back to Session.
 * Automatically refreshes expired access tokens.
 */
async function getOutlookTokens(req) {
    const userId = req.user?.id || req.user?.userId;

    // 1. Prioritize Database Token (so we can automatically refresh it)
    if (userId) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (user?.outlookAccessToken) {
                // If it's expired, attempt refresh
                if (isTokenExpired(user.outlookAccessToken) && user.outlookRefreshToken) {
                    console.log("GraphService: DB access token expired, attempting refresh...");
                    try {
                        const refreshed = await refreshAccessToken(user.outlookRefreshToken);
                        if (refreshed?.accessToken) {
                            const newAccessToken = refreshed.accessToken;
                            const newRefreshToken = refreshed.refreshToken || user.outlookRefreshToken;

                            await prisma.user.update({
                                where: { id: user.id },
                                data: {
                                    outlookAccessToken: newAccessToken,
                                    outlookRefreshToken: newRefreshToken
                                }
                            });

                            const tokenData = {
                                accessToken: newAccessToken,
                                refreshToken: newRefreshToken,
                                email: user.outlookEmail
                            };
                            if (req.session) req.session.outlook = tokenData;
                            return tokenData;
                        }
                    } catch (refreshErr) {
                        console.warn("GraphService: Token refresh failed, checking if token is expired/revoked:", refreshErr.message);
                        const isAuthError = refreshErr.errorCode?.includes("invalid_grant") || 
                                            refreshErr.message?.includes("invalid_grant") || 
                                            refreshErr.message?.includes("expired") || 
                                            refreshErr.message?.includes("validation failed") ||
                                            refreshErr.message?.includes("interaction_required") ||
                                            refreshErr.errorCode?.includes("invalid_client");
                        if (isAuthError) {
                            console.log("GraphService: Clearing invalid Outlook tokens from DB.");
                            try {
                                await prisma.user.update({
                                    where: { id: user.id },
                                    data: {
                                        outlookAccessToken: null,
                                        outlookRefreshToken: null,
                                        outlookEmail: null
                                    }
                                });
                            } catch (dbUpdateErr) {
                                console.error("GraphService: Failed to clear invalid Outlook tokens from DB:", dbUpdateErr);
                            }
                            if (req.session) {
                                delete req.session.outlook;
                            }
                            return null;
                        }
                    }
                }

                // Stored token is still valid (or refresh wasn't possible/didn't fail auth check)
                const tokenData = {
                    accessToken: user.outlookAccessToken,
                    refreshToken: user.outlookRefreshToken,
                    email: user.outlookEmail
                };
                if (req.session) req.session.outlook = tokenData;
                return tokenData;
            }
        } catch (dbErr) {
            console.error("GraphService: Error fetching user Outlook tokens from DB:", dbErr);
        }
    }

    // 2. Session Fallback
    if (req.session?.outlook?.accessToken) {
        const sessionOutlook = req.session.outlook;
        
        // If session token is expired, try to refresh it
        if (isTokenExpired(sessionOutlook.accessToken) && sessionOutlook.refreshToken) {
            console.log("GraphService: Session access token expired, attempting refresh...");
            try {
                const refreshed = await refreshAccessToken(sessionOutlook.refreshToken);
                if (refreshed?.accessToken) {
                    sessionOutlook.accessToken = refreshed.accessToken;
                    sessionOutlook.refreshToken = refreshed.refreshToken || sessionOutlook.refreshToken;
                    req.session.outlook = sessionOutlook;

                    // If we have a logged in user, also update DB
                    if (userId) {
                        await prisma.user.update({
                            where: { id: userId },
                            data: {
                                outlookAccessToken: sessionOutlook.accessToken,
                                outlookRefreshToken: sessionOutlook.refreshToken
                            }
                        });
                    }
                }
            } catch (refreshErr) {
                console.warn("GraphService: Session token refresh failed:", refreshErr.message);
                const isAuthError = refreshErr.errorCode?.includes("invalid_grant") || 
                                    refreshErr.message?.includes("invalid_grant") || 
                                    refreshErr.message?.includes("expired") || 
                                    refreshErr.message?.includes("validation failed") ||
                                    refreshErr.message?.includes("interaction_required") ||
                                    refreshErr.errorCode?.includes("invalid_client");
                if (isAuthError) {
                    if (req.session) {
                        delete req.session.outlook;
                    }
                    if (userId) {
                        try {
                            await prisma.user.update({
                                where: { id: userId },
                                data: {
                                    outlookAccessToken: null,
                                    outlookRefreshToken: null,
                                    outlookEmail: null
                                }
                            });
                        } catch (dbUpdateErr) {
                            console.error("GraphService: Failed to clear invalid Outlook tokens from DB:", dbUpdateErr);
                        }
                    }
                    return null;
                }
            }
        }
        
        return sessionOutlook;
    }

    return null;
}

module.exports = {
    getAuthUrl,
    getTokenFromCode,
    refreshAccessToken,
    getGraphClient,
    getOutlookTokens,
    SCOPES
};