const prisma = require("../config/prisma");
const calendarService = require("../services/calendarService");

// Create Activity

exports.createActivity = async (req, res) => {

    try {

      const {
  title,
  type,
  date,
  time,
  duration,
  description,
  salesperson,
  leadId,
  opportunityId,

  startTime,
  endTime,
  location,
  attendees,

  syncOutlook,
  teamsMeeting
} = req.body;

console.log("===== CREATE ACTIVITY =====");
console.log("Request Body:", req.body);

console.log({
  type,
  syncOutlook,
  teamsMeeting,
  hasSession: !!req.session,
  hasOutlook: !!req.session?.outlook,
  hasToken: !!req.session?.outlook?.accessToken
});

let outlookEvent = null;
console.log("Checking Outlook sync...");
console.log("===== CREATE ACTIVITY =====");
console.log("type:", type);
console.log("syncOutlook:", syncOutlook);
console.log("Has token:", !!req.session?.outlook?.accessToken);
if (
    type === "Meeting" &&
    syncOutlook &&
    req.session?.outlook?.accessToken
) {
console.log("Creating Outlook meeting...");
    outlookEvent = await calendarService.createMeeting(

        req.session.outlook.accessToken,

        {

            subject: title,

            description,

            start: startTime,

            end: endTime,

            location,

            attendees,

          teamsMeeting: !!teamsMeeting

        }

    );
console.log("Outlook Event Created:");
console.log(outlookEvent);
}

        const activity = await prisma.activity.create({

            data: {

    title,

    type,

    date: new Date(date),

    time,

    duration: Number(duration),

    description,

    salesperson,

    leadId,

    opportunityId,

    startTime:
        startTime
            ? new Date(startTime)
            : null,

    endTime:
        endTime
            ? new Date(endTime)
            : null,

    location,

    attendees,

  isOutlookSynced:
    syncOutlook && !!outlookEvent,

    outlookEventId:
        outlookEvent?.id || null,

    meetingUrl:
        outlookEvent?.onlineMeeting?.joinUrl || null

}
        });


        res.status(201).json(activity);

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: err.message
        });

    }

};



// Get All Activities

exports.getActivities = async (req, res) => {

    try {
        const user = req.user;
        const userRole = (user.role || '').toUpperCase().replace(/[\s_]+/g, '_');

        let whereClause = {};
        if (userRole === 'USER') {
            whereClause = { salesperson: user.name };
        }

        const activities = await prisma.activity.findMany({
            where: whereClause,
            orderBy: {
                date: "asc"
            }
        });

        res.json(activities);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};




// Update

exports.updateActivity = async (req, res) => {

    try {

        const { id } = req.params;

        // Get existing activity
        const oldActivity = await prisma.activity.findUnique({

            where: {
                id
            }

        });

        // If this activity is synced with Outlook, update the Outlook meeting
        if (

            oldActivity?.outlookEventId &&
            req.session?.outlook?.accessToken

        ) {

            await calendarService.updateMeeting(

                req.session.outlook.accessToken,

                oldActivity.outlookEventId,

                {

                    subject: req.body.title,

                    body: req.body.description
                        ? {
                              contentType: "HTML",
                              content: req.body.description
                          }
                        : undefined,

                    start: req.body.startTime
                        ? {
                              dateTime: req.body.startTime,
                              timeZone: "India Standard Time"
                          }
                        : undefined,

                    end: req.body.endTime
                        ? {
                              dateTime: req.body.endTime,
                              timeZone: "India Standard Time"
                          }
                        : undefined,

                    location: req.body.location
                        ? {
                              displayName: req.body.location
                          }
                        : undefined,

                    attendees: req.body.attendees
                        ? req.body.attendees.map(email => ({
                              emailAddress: {
                                  address: email
                              },
                              type: "required"
                          }))
                        : undefined

                }

            );

        }

        // Update activity in CRM database
        const activity = await prisma.activity.update({

            where: {

                id

            },

            data: {

                ...req.body,

                startTime: req.body.startTime
                    ? new Date(req.body.startTime)
                    : undefined,

                endTime: req.body.endTime
                    ? new Date(req.body.endTime)
                    : undefined

            }

        });

        res.json(activity);

    } catch (err) {

        console.error(err);

        res.status(500).json({

            message: err.message

        });

    }

};



// Toggle Done

exports.toggleDone = async (req, res) => {

    try {

        const { id } = req.params;

        const { done } = req.body;

        const activity = await prisma.activity.update({

            where: {

                id

            },

            data: {

                done: !done

            }

        });

        res.json(activity);

    }

    catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};




// Delete

exports.deleteActivity = async (req, res) => {

    try {

        const { id } = req.params;

const activity =
    await prisma.activity.findUnique({

        where: {

            id

        }

    });

if (

    activity?.outlookEventId &&

    req.session?.outlook?.accessToken

) {

    await calendarService.deleteMeeting(

        req.session.outlook.accessToken,

        activity.outlookEventId

    );

}

        await prisma.activity.delete({

            where: {

                id

            }

        });

        res.json({

            message: "Deleted Successfully"

        });

    }

    catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};