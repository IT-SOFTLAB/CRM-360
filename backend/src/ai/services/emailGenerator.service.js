const { groq, GROQ_MODEL } = require("../config/groq");

class EmailGenerator {

    async generate({ template, lead }) {

        const prompt = `

Write a professional business email.

Template:

${template}

Recipient:

${lead}

Return ONLY JSON.

{
    "subject":"",
    "body":""
}

`;

        const completion =
            await groq.chat.completions.create({

                model: GROQ_MODEL,

                temperature: 0.5,

                response_format: {

                    type: "json_object"

                },

                messages: [

                    {

                        role: "user",

                        content: prompt

                    }

                ]

            });

        return JSON.parse(
            completion.choices[0].message.content
        );

    }

}

module.exports = new EmailGenerator();