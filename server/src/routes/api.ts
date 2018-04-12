import { Application } from "express";
import { IDatabase } from "../database/database";
import PassportController from "../passports/PassportController";


export default function initApi(app: Application, config: any, database: IDatabase, connectionManager: any) {
  const API_BASE = process.env.API_BASE;
  const passportController = new PassportController(config, database);

  app.post(API_BASE + "/passports/token", passportController.getToken);
  app.post(API_BASE + "/passports/user", passportController.getPassport);
  
  app.get(API_BASE + "/test", (req, res) => {
    res.status(200).json({data: "test"});
  });
}
