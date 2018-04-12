const dotenv = require("dotenv");

dotenv.config({ path: ".env" });

module.exports = {
  "development": {
    "database": {
      "connectionString": process.env.DB_CONNECTION_STRING,
    },
    "server": {
      "jwt": {
        "secret": process.env.JWT_SECRET,
        "expiration": "30 days",
        "algorithm": "HS256",
        "issuer": "Freshworks",
        "audience": "www.freshworks.io"
      },
    },
    "hyperledger": {
      "adminBusinessNetworkCardName": "admin@freshblocks.card",
      "adminBusinessNetworkCardArchiveFilePath": process.env.ADMIN_CARD_PATH
    }
  }
};
