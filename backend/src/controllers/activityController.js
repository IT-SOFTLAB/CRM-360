const prisma = require("../config/prisma");
const calendarService = require("../services/calendarService");
const { getOutlookTokens } = require("../services/graphService");
const { getCache, setCache, deletePatternCache } = require("../config/redisCache");


const invalidateActivityCache = async (organizationId) => {
  if (!organizationId) return;
  // Invalidate activity list caches
  await deletePatternCache(`crm:activities:${organizationId}:*`);
  // Invalidate dashboard caches (since today's & pending activity counts change)
  await deletePatternCache(`crm:dashboard:${organizationId}:*`);
};

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
const outlookTokens = await getOutlookTokens(req);
if (type === "Meeting" && syncOutlook && outlookTokens?.accessToken) {
    outlookEvent = await calendarService.createMeeting(
        outlookTokens.accessToken,

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
    organizationId: req.organizationId,

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

 await invalidateActivityCache(req.organizationId);
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
        const organizationId = req.organizationId;
        const userId = user.id;

        const cacheKey = `crm:activities:${organizationId}:${userRole}:${userId}`;

        // 1. Check Redis Cache First
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            console.log(`Activities cache HIT: ${cacheKey}`);
            return res.status(200).json(cachedData);
        }

        console.log(`Activities cache MISS: ${cacheKey}`);

        let whereClause = { organizationId };
        if (userRole === 'USER') {
            whereClause.salesperson = user.name;
        }

        const activities = await prisma.activity.findMany({
            where: whereClause,
            orderBy: {
                date: "asc"
            }
        });

        // 2. Store in Redis Cache (Short TTL = 60 seconds)
        await setCache(cacheKey, activities, 60);

        return res.status(200).json(activities);

    } catch (err) {
        console.error("getActivities error:", err);
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
        const oldActivity = await prisma.activity.findFirst({
            where: {
                id,
                organizationId: req.organizationId
            }
        });
        if (!oldActivity) return res.status(404).json({ message: 'Not found' });

        const outlookTokens = await getOutlookTokens(req);
        if (oldActivity?.outlookEventId && outlookTokens?.accessToken) {
            await calendarService.updateMeeting(
                outlookTokens.accessToken,

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
       await prisma.activity.updateMany({
    where: {
        id,
        organizationId: req.organizationId
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

const activity = await prisma.activity.findFirst({
    where: {
        id,
        organizationId: req.organizationId
    }
});
  await invalidateActivityCache(req.organizationId);
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

        const existing = await prisma.activity.findFirst({ where: { id, organizationId: req.organizationId } });
        if (!existing) return res.status(404).json({ message: 'Not found' });

      await prisma.activity.updateMany({
    where: {
        id,
        organizationId: req.organizationId
    },
    data: {
        done: !done
    }
});

const activity = await prisma.activity.findFirst({
    where: {
        id,
        organizationId: req.organizationId
    }
});

await invalidateActivityCache(req.organizationId);
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
    await prisma.activity.findFirst({
        where: {
            id,
            organizationId: req.organizationId
        }
    });
if (!activity) return res.status(404).json({ message: 'Not found' });

const outlookTokens = await getOutlookTokens(req);
if (activity?.outlookEventId && outlookTokens?.accessToken) {
    await calendarService.deleteMeeting(
        outlookTokens.accessToken,

        activity.outlookEventId

    );

}

       await prisma.activity.deleteMany({
    where: {
        id,
        organizationId: req.organizationId
    }
});
  await invalidateActivityCache(req.organizationId);
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