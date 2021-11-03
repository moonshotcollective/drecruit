require("dotenv").config();

module.exports = {
  API_CONFIG: {
    api: {
      sessionOptions: {
        cookie: {
          secure: true,
          sameSite: "None",
          domain: "drecruit-web-staging.herokuapp.com",
        },
      },
    },
  },
};
