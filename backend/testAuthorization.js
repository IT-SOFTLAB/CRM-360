const Auth = require("./src/ai/services/authorization.service");

console.log(

Auth.leadFilter({

    id: "u1",

    role: "ADMIN"

})

);

console.log(

Auth.leadFilter({

    id: "u2",

    role: "USER"

})

);