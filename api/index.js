const { app, initializeDB } = require("../express_api_server");

let databasePromise;

module.exports = async function handler(request, response) {
  databasePromise ??= initializeDB();
  await databasePromise;
  return app(request, response);
};
