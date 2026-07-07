const prisma = require("../config/prisma");


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
            opportunityId
        } = req.body;


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
                opportunityId

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

        const activity = await prisma.activity.update({

            where: {

                id

            },

            data: req.body

        });

        res.json(activity);

    }

    catch (err) {

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