import * as Mongoose from "mongoose";
import { IPassport, PassportModel } from "../passports/passport";
import { ComposerCardModel, IComposerCard } from '../composer/ComposerCard';
import { IDatabase } from './database';
//import { LoggerInstance } from 'winston';

export default class MongoDatabase implements IDatabase {

  passportModel: Mongoose.Model<IPassport> = PassportModel;
  composerCardModel: Mongoose.Model<IComposerCard> = ComposerCardModel;

  constructor(private config: any) {}

  async initialize() {
    (<any>Mongoose).Promise = Promise;
    Mongoose.connect(process.env.MONGO_URL || this.config.connectionString);

    let mongoDb = Mongoose.connection;

    mongoDb.on('error', () => {
      console.error(`Unable to connect to database`);
    });

    mongoDb.once('open', () => {
      console.log(`Connected to database`);
    });
  }
}
