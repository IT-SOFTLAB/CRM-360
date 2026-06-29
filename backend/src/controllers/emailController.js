const {

    getGraphClient

}=require("../services/graphService");

exports.getInbox=async(req,res)=>{

    try{

        const client=getGraphClient(global.accessToken);

        const mails=await client

        .api("/me/messages")

        .top(30)

        .orderby("receivedDateTime DESC")

        .get();

        res.json(mails.value);

    }

    catch(err){

        res.status(500).json(err);

    }

};

exports.sendMail=async(req,res)=>{

    try{

        const client=getGraphClient(global.accessToken);

        await client.api("/me/sendMail").post({

            message:{

                subject:req.body.subject,

                body:{

                    contentType:"HTML",

                    content:req.body.body

                },

                toRecipients:[

                    {

                        emailAddress:{

                            address:req.body.to

                        }

                    }

                ]

            }

        });

        res.json({

            success:true

        });

    }

    catch(err){

        res.status(500).json(err);

    }

};