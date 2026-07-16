const { getGraphClient } = require("./graphService");

/**
 * Create Outlook Calendar Event
 */
exports.createMeeting = async (accessToken, data) => {
  console.log("=== CREATE MEETING CALLED ===");
    const client = getGraphClient(accessToken);

   try {

   const payload = {
    subject: data.subject,

    body: {
        contentType: "HTML",
        content: data.description || ""
    },

    start: {
        dateTime: data.start,
        timeZone: "India Standard Time"
    },

    end: {
        dateTime: data.end,
        timeZone: "India Standard Time"
    },

    location: {
        displayName: data.location || ""
    },

    attendees: (data.attendees || []).map(email => ({
        emailAddress: {
            address: email
        },
        type: "required"
    }))
};

if (data.teamsMeeting) {
    payload.isOnlineMeeting = true;
    payload.onlineMeetingProvider = "teamsForBusiness";
}

console.log("========== GRAPH PAYLOAD ==========");
console.log(payload);

const event = await client
    .api("/me/events")
    .post(payload);
console.log("========== GRAPH PAYLOAD ==========");
console.log({
    subject: data.subject,
    description: data.description,
    start: data.start,
    end: data.end,
    location: data.location,
    attendees: data.attendees,
    teamsMeeting: data.teamsMeeting
});
    console.log("Outlook Event Created:");
    console.log(event);

    return event;

} catch (err) {

    console.error("Graph Create Meeting Error:");
    console.error(err);

    throw err;

}
};

/**
 * Update Outlook Meeting
 */
exports.updateMeeting = async (
    accessToken,
    eventId,
    data
) => {

    const client = getGraphClient(accessToken);

    await client
        .api(`/me/events/${eventId}`)
        .patch(data);

    return true;

};

/**
 * Delete Outlook Meeting
 */
exports.deleteMeeting = async (
    accessToken,
    eventId
) => {

    const client = getGraphClient(accessToken);

    await client
        .api(`/me/events/${eventId}`)
        .delete();

    return true;

};

/**
 * Get Calendar Events
 */
exports.getMeetings = async (
    accessToken
) => {

    const client = getGraphClient(accessToken);

    const events = await client
        .api("/me/events")
        .select(
          "id,subject,bodyPreview,start,end,location,attendees,isOnlineMeeting,onlineMeeting,organizer,webLink"
        )
        .orderby("start/dateTime")
        .top(100)
        .get();

    return events.value;

};

/**
 * Get Single Meeting
 */
exports.getMeeting = async (
    accessToken,
    eventId
) => {

    const client = getGraphClient(accessToken);

    return await client
        .api(`/me/events/${eventId}`)
        .get();

};