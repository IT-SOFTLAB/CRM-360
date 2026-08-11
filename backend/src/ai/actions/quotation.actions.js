const QuotationService = require("../services/quotationService");

module.exports = {

    //----------------------------------------
    // Create Quotation
    //----------------------------------------

    async create(parameters, req) {

        return await QuotationService.create(

            req.user,

            parameters

        );

    }

};