import * as Express from "express";
import { IDatabase } from "../database/database";
import ComposerConnectionManager from "../composer/ComposerConnectionManager";
import PassportController from "../passports/PassportController";

export default function initApi(
  app: Express.Application, 
  config: any, 
  database: IDatabase, 
  connectionManager: ComposerConnectionManager
) {

  const passportController = new PassportController(config, database, connectionManager);

  app.all("/*", passportController.authenticate);
  app.post("/passports/signup", passportController.signup);
  app.post("/passports/token", passportController.getToken);
  app.post("/passports/user", passportController.getPassport);
  app.get("/test", passportController.test);

}
