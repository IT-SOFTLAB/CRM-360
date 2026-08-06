class ConfirmationService {

    constructor() {

        this.pending = new Map();

    }

    //-----------------------------------
    // Store Pending Action
    //-----------------------------------

    create(userId, plan) {

        this.pending.set(userId, plan);

    }

    //-----------------------------------
    // Get Pending Action
    //-----------------------------------

    get(userId) {

        return this.pending.get(userId);

    }

    //-----------------------------------
    // Remove Pending Action
    //-----------------------------------

    clear(userId) {

        this.pending.delete(userId);

    }

}

module.exports = new ConfirmationService();