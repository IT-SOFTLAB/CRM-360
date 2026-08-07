const { getGraphClient } = require("../../services/graphService");

class EmailReader {

    //----------------------------------
    // Get unread emails
    //----------------------------------

    async unread(accessToken) {

        const client = getGraphClient(accessToken);

        const response = await client

            .api("/me/messages")

            .filter("isRead eq false")

            .top(10)

            .orderby("receivedDateTime DESC")

            .get();

        return response.value;

    }

}

module.exports = new EmailReader();