import * as Express from "express";
import * as Jwt from "jsonwebtoken";
import { IDatabase } from "../database/database";
import { IPassport } from "./passport";

export default class PassportController {

  constructor(
    private config: any,
    private database: IDatabase,
  ) {
  }

  /***
   *  API route
   *  Look up the passport by the the supplied user credentials
   *  Return token and passport information
   *  This token can be used for authentication for future REST server requests
   */
  async getToken(req: Express.Request, res: Express.Response) {
    const email = req.body.email;
    const password = req.body.password;

    console.log(`retrieving token for passport ${email} ...`);

    let passport: IPassport = await this.database.passportModel.findOne({ email: email });

    if (!passport) {
      return res.send(404).json({message: "Passport not found"});
    }

    if (!passport.validatePassword(password)) {
      return res.send(400).json({message: "Password is invalid"});
    }

    res.send(200).json({
      token: this.generateToken(passport),
      firstName: passport.firstName,
      lastName: passport.lastName,
      email: passport.email
    });
  }


  /**
   * API route
   * Get passport for user by token
   * @param {Request} request
   * @param {ReplyNoContinue} reply
   * @returns {Promise<void>}
   */
  async getPassport(req: Express.Request, res: Express.Response) {
    let userId = req.body.id;
    let passport: IPassport = await this.database.passportModel
      .findOne({ email: userId })
      .select('-_id -__v -password');

    res.send(200).json({
      passport
    });
  }

  /**
   * Generate a Json Web Token for the user request
   */
  private generateToken(passport: IPassport) {
    let jwtSecret = this.config.jwt.secret;
    const jwtExpiration = this.config.jwt.expiration;
    const payload = { id: passport.email };

    return Jwt.sign(payload, jwtSecret, {
      expiresIn: jwtExpiration,
      subject: passport.email,
      algorithm: this.config.jwt.algorithm,
      issuer: this.config.jwt.issuer,
      audience: this.config.jwt.audience
    });
  }
}
