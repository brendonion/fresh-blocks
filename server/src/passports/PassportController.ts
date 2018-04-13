import * as Express from "express";
import * as Jwt from "jsonwebtoken";
import { IDatabase } from "../database/database";
import { IPassport } from "./passport";
import ComposerConnectionManager from "../composer/ComposerConnectionManager";

export default class PassportController {

  constructor(
    private config: any,
    private database: IDatabase,
    private connectionManager: ComposerConnectionManager
  ) {}

  /**
   * API route
   * 
   * Create composer card from user email
   * Add card and user information to database
   */
  authenticate = (req: Express.Request, res: Express.Response, next: Function) => {
    if (req.path.includes("/passports/token")) return next();
    if (req.path.includes("/passports/signup")) return next();
    if (!req.headers.authorization) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    Jwt.verify(req.headers.authorization, this.config.server.jwt.secret, (err, decoded) => {
      if (err) {
        res.status(401).json({ error: err.message });
      }
      res.locals.userEmail = decoded.sub;
      next();
    });
  }

  /**
   * API route
   * 
   * Create composer card from user email
   * Add card and user information to database
   */
  signup = async (req: Express.Request, res: Express.Response) => {
    try {
      await this.connectionManager.importNewIdCard(req.body.email, 'secret');
      
      const userPassport = {
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        password: req.body.password,
      };
      
      await this.database.passportModel.create(userPassport);
      
      const { password, ...response } = userPassport;
      
      return res.status(200).json({ passport: response });
    } catch (error) {
      return res.status(500).json({ error });
    }
  }

  test = async (req: Express.Request, res: Express.Response) => {
    try {
      const connection = await this.connectionManager.createBusinessNetworkConnection('test2@test.com');
      const registry = await connection.bizNetworkConnection.getAssetRegistry('org.freshworks.SampleAsset');
      const data = await registry.getAll();
  
      return res.status(200).json({ data });
    } catch (error) {
      return res.status(500).json({ error: error.message || "Something went wrong" });
    }
  }

  /***
   * API route
   * 
   * Look up the passport by the the supplied user credentials
   * Return token and passport information
   * This token can be used for authentication for future REST server requests
   */
  getToken = async (req: Express.Request, res: Express.Response) => {
    const email = req.body.email;
    const password = req.body.password;
    const passport: IPassport = await this.database.passportModel.findOne({ email });

    if (!passport) {
      return res.status(404).json({ message: "Passport not found" });
    }

    if (!passport.validatePassword(password)) {
      return res.status(400).json({ message: "Password is invalid" });
    }

    res.status(200).json({
      token: this.generateToken(passport),
      firstName: passport.firstName,
      lastName: passport.lastName,
      email: passport.email,
    });
  }

  /**
   * API route
   * 
   * Get passport for user by token
   */
  getPassport = async (req: Express.Request, res: Express.Response): Promise<void> => {
    const email = req.body.email;
    const passport: IPassport = await this.database.passportModel
      .findOne({ email })
      .select('-_id -__v -password');

    res.status(200).json({ passport });
  }

  /**
   * Generate a Json Web Token for the user request
   */
  private generateToken = (passport: IPassport): string => {
    const { secret, expiration, algorithm, issuer, audience } = this.config.server.jwt;
    const payload = { id: passport._id };

    return Jwt.sign(payload, secret, {
      expiresIn: expiration,
      subject: passport.email,
      algorithm,
      issuer,
      audience
    });
  }
}
