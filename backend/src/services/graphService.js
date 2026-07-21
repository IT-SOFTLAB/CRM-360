// require("isomorphic-fetch");

// const {
//     ConfidentialClientApplication
// } = require("@azure/msal-node");

// const graph = require("@microsoft/microsoft-graph-client");

// const msalConfig = {

//     auth:{

//         clientId:process.env.CLIENT_ID,

//        // authority:`https://login.microsoftonline.com/${process.env.TENANT_ID}`,
// authority: "https://login.microsoftonline.com/common",
//         clientSecret:process.env.CLIENT_SECRET

//     }

// };

// const cca = new ConfidentialClientApplication(msalConfig);

// function getAuthUrl(){
     
//     return cca.getAuthCodeUrl({

//         scopes:[
//             "User.Read",
//             "Mail.Read",
//             "Mail.ReadWrite",
//             "Mail.Send",
//             "offline_access"
//         ],
       
//         redirectUri:process.env.REDIRECT_URI
   
//     });

// }

// async function getTokenFromCode(code){

//     const response = await cca.acquireTokenByCode({

//         code,

//         scopes:[
//             "User.Read",
//             "Mail.Read",
//             "Mail.ReadWrite",
//             "Mail.Send",
//             "offline_access"
//         ],

//         redirectUri:process.env.REDIRECT_URI

//     });

//     return response;

// }

// function getGraphClient(accessToken){

//     return graph.Client.init({

//         authProvider:(done)=>{

//             done(null,accessToken);

//         }

//     });
// }

// module.exports={

//     getAuthUrl,

//     getTokenFromCode,

//     getGraphClient

// };

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

/**
 * Robustly retrieves valid Outlook tokens for a request.
 * Checks req.session.outlook first, then falls back to User DB.
 * Automatically refreshes expired access tokens.
 */
async function getOutlookTokens(req) {
    // 1. Session check
    if (req.session?.outlook?.accessToken) {
        return req.session.outlook;
    }

    // 2. Database fallback via authenticated User ID
    const userId = req.user?.id || req.user?.userId;
    if (userId) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (user?.outlookAccessToken) {
                // Try refreshing if refresh token exists
                if (user.outlookRefreshToken) {
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
                        console.warn("GraphService: Token refresh failed, using stored token:", refreshErr.message);
                    }
                }

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