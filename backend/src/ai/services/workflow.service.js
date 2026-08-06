class WorkflowService {

    constructor() {

        this.context = {};

    }

    //----------------------------------------
    // Save Step Result
    //----------------------------------------

    save(step, result) {

        this.context[step.action] = result;

    }

    //----------------------------------------
    // Get Result
    //----------------------------------------

    get(action) {

        return this.context[action];

    }

    //----------------------------------------
    // Get Entire Context
    //----------------------------------------

    getAll() {

        return this.context;

    }

    //----------------------------------------
    // Clear Context
    //----------------------------------------

    clear() {

        this.context = {};

    }

}

module.exports = new WorkflowService();