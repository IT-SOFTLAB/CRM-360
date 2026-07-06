require("isomorphic-fetch");

const {
    ConfidentialClientApplication
} = require("@azure/msal-node");

const graph = require("@microsoft/microsoft-graph-client");

const msalConfig = {

    auth:{

        clientId:process.env.CLIENT_ID,

        authority:`https://login.microsoftonline.com/${process.env.TENANT_ID}`,

        clientSecret:process.env.CLIENT_SECRET

    }

};

const cca = new ConfidentialClientApplication(msalConfig);

function getAuthUrl(){

    return cca.getAuthCodeUrl({

        scopes:[
            "User.Read",
            "Mail.Read",
            "Mail.ReadWrite",
            "Mail.Send",
            "offline_access"
        ],

        redirectUri:process.env.REDIRECT_URI

    });

}

async function getTokenFromCode(code){

    const response = await cca.acquireTokenByCode({

        code,

        scopes:[
            "User.Read",
            "Mail.Read",
            "Mail.ReadWrite",
            "Mail.Send",
            "offline_access"
        ],

        redirectUri:process.env.REDIRECT_URI

    });

    return response;

}

function getGraphClient(accessToken){

    return graph.Client.init({

        authProvider:(done)=>{

            done(null,accessToken);

        }

    });
}

module.exports={

    getAuthUrl,

    getTokenFromCode,

    getGraphClient

};