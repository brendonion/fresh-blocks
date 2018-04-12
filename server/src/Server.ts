import * as bodyParser from "body-parser";
import * as express from "express";
import * as path from "path";
import * as logger from "morgan";
import * as errorHandler from "errorhandler";
import * as fs from "fs";
import { IdCard } from 'composer-common';
import MongoDatabase from "./database/MongoDatabase";
import ComposerConnectionManager from "./composer/ComposerConnectionManager";
import initApi from "./routes/api";

/**
 * The server.
 *
 * @class Server
 */
export default class Server {

  public app: express.Application;

  /**
   * Constructor.
   *
   * @class Server
   * @constructor
   */
  constructor() {
    // create expressjs application
    this.app = express();

    // configure application
    this.config();
  }

  /**
   * Bootstrap the application.
   *
   * @class Server
   * @method bootstrap
   * @static
   */
  public static bootstrap(): Server {
    return new Server();
  }

  /**
   * Configure application
   *
   * @class Server
   * @method config
   */
  public config() {
    // Add static paths
    this.app.use(express.static(path.join(__dirname, "public")));

    // Mount json form parser
    this.app.use(bodyParser.json());

    // Mount query string parser
    this.app.use(bodyParser.urlencoded({extended: true}));

    // Mount logger
    this.app.use(logger("dev"));
   
    // Error handling
    this.app.use(errorHandler());

    // Catch 404 and forward to error handler
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      err.status = 404;
      next(err);
    });

    // Initialize database and routes
    this.initialize();
  }

  /**
   * Initialize application
   *
   * @class Server
   * @method config
   */
  public async initialize() {
    const env = process.env.NODE_ENV || "development";
    const config = require(__dirname + "/config/index")[env];
    const database = new MongoDatabase(config.database);
    
    // Initialize database
    await database.initialize();

    const connectionManager = new ComposerConnectionManager(database);

    await addAdminUser(database, config.hyperledger, connectionManager);

    // Handle api routes
    initApi(this.app, config, database, connectionManager);
  }

}

/**
 * Adding the admin@freshblocks user for testing purposes
 * Add the already registred business network card to our mongodb cardstore
 * Create passport for this admin user
 */
async function addAdminUser(database: any, hyperledgerConfig: any, connectionManager: ComposerConnectionManager): Promise<void> {

  // Read admin business network card file and import
  const data = fs.readFileSync(hyperledgerConfig.adminBusinessNetworkCardArchiveFilePath);
  const card = await IdCard.fromArchive(data);

  // Import the business network card into our cardstore, an adminConnection is required for this. This cannot be done through the normal business network connection
  try {
    await connectionManager.importIdCard(hyperledgerConfig.adminBusinessNetworkCardName, card);
    console.log(`The card is loaded`);
  } catch (err) {
    console.log('Card cannot be loaded: ', err);
  }

  const newCard = await connectionManager.getCard(hyperledgerConfig.adminBusinessNetworkCardName);

  const adminPassport = {
    email: 'admin@freshblocks.com',
    firstName: 'admin',
    lastName: 'adminL',
    password: 'password',
    cardId: newCard._id,
  };

  // Save admin passport to database
  await database.passportModel.remove({email: 'admin@freshblocks.com'});
  await database.passportModel.create(adminPassport);

  console.log(`Admin created ${adminPassport}`);
}
