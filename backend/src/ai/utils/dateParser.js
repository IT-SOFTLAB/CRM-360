function parseDate(input) {

    if (!input) {

        return new Date();

    }

    const today = new Date();

    const value = input.toLowerCase().trim();

    //-----------------------------------
    // Today
    //-----------------------------------

    if (value === "today") {

        return today;

    }

    //-----------------------------------
    // Tomorrow
    //-----------------------------------

    if (value === "tomorrow") {

        const tomorrow = new Date(today);

        tomorrow.setDate(today.getDate() + 1);

        return tomorrow;

    }

    //-----------------------------------
    // Weekdays
    //-----------------------------------

    const weekdays = {

        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6

    };

    if (weekdays[value] !== undefined) {

        const targetDay = weekdays[value];

        const result = new Date(today);

        let diff = targetDay - today.getDay();

        if (diff <= 0) {

            diff += 7;

        }

        result.setDate(today.getDate() + diff);

        return result;

    }

    //-----------------------------------
    // Normal Date
    //-----------------------------------

    return new Date(input);

}

module.exports = {
    parseDate
};