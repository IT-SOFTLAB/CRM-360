//const { getGraphClient } = require("../services/graphService");
const calendarService = require("../services/calendarService");


// Get Calendar Events
exports.getEvents = async (req, res) => {
    try {
if (!req.session?.outlook?.accessToken) {
    return res.status(401).json({
        success: false,
        message: "Outlook is not connected."
    });
}
      //  const client = getClient(req);

       const events = await calendarService.getMeetings(
    req.session.outlook.accessToken
);

res.json(events);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }
};

// Create Event
exports.createEvent = async (req, res) => {

    try {
if (!req.session?.outlook?.accessToken) {
    return res.status(401).json({
        success: false,
        message: "Outlook is not connected."
    });
}
        const event = await calendarService.createMeeting(

            req.session.outlook.accessToken,

            req.body

        );

        res.json(event);

    } catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

// Update Event
exports.updateEvent = async (req, res) => {

    try {
if (!req.session?.outlook?.accessToken) {
    return res.status(401).json({
        success: false,
        message: "Outlook is not connected."
    });
}
        await calendarService.updateMeeting(

            req.session.outlook.accessToken,

            req.params.id,

            req.body

        );

        res.json({

            success: true

        });

    } catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

// Delete Event
exports.deleteEvent = async (req, res) => {

    try {
if (!req.session?.outlook?.accessToken) {
    return res.status(401).json({
        success: false,
        message: "Outlook is not connected."
    });
}
        await calendarService.deleteMeeting(

            req.session.outlook.accessToken,

            req.params.id

        );

        res.json({

            success: true

        });

    } catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};
exports.getStatus = async (req, res) => {
  try {
    if (!req.session?.outlook?.accessToken) {
    return res.status(401).json({
        success: false,
        message: "Outlook is not connected."
    });
}

    res.json({
      connected: true,
      email: req.session.outlook.email
    });

  } catch (err) {
    res.status(500).json({
      connected: false
    });
  }
};