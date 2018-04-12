import * as Mongoose from "mongoose";
import { IPassport } from "../passports/passport";
import { IComposerCard } from '../composer/ComposerCard';

export interface IDatabase {
  passportModel: Mongoose.Model<IPassport>;
  composerCardModel: Mongoose.Model<IComposerCard>;
}
