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

function getAuthUrl() {

    return cca.getAuthCodeUrl({

        scopes: SCOPES,

        redirectUri: process.env.REDIRECT_URI

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

function getGraphClient(accessToken) {

    return graph.Client.init({

        authProvider: (done) => {

            done(null, accessToken);

        }

    });

}

module.exports = {

    getAuthUrl,

    getTokenFromCode,

    getGraphClient,

    SCOPES

};