const {

    getAuthUrl,

    getTokenFromCode

}=require("../services/graphService");

exports.login=async(req,res)=>{

    const url=await getAuthUrl();

    res.redirect(url);

};

exports.callback=async(req,res)=>{

    try{

        const token=await getTokenFromCode(req.query.code);

        global.accessToken=token.accessToken;

        global.refreshToken=token.refreshToken;

        res.send("Outlook Connected Successfully");

    }

    catch(err){

        console.log(err);

        res.status(500).json(err);

    }

};