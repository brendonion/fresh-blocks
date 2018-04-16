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
   * Authenticates each request.
   */
  authenticate = (req: Express.Request, res: Express.Response, next: Function) => {
    if (req.path.includes("/passports/token")) return next();
    
    if (req.path.includes("/passports/signup")) return next();
    
    if (!req.headers.authorization) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    Jwt.verify(req.headers.authorization, this.config.server.jwt.secret, (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: err.message });
      }
      res.locals.userEmail = decoded.sub;
      next();
    });
  }

  /**
   * API route
   * 
   * Creates a composer card from user email.
   * Adds user to User registry and issues an identity.
   * Card and user information is stored in the database.
   */
  signup = async (req: Express.Request, res: Express.Response): Promise<Express.Response> => {
    // TODO: validate request body
    try {
      const userPassport = {
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        password: req.body.password,
      };
      const cardName = userPassport.email;
      const { adminBusinessNetworkCardName } = this.config.hyperledger;
      const adminConnection = await this.connectionManager.createBusinessNetworkConnection(adminBusinessNetworkCardName);
      const userRegistry = await adminConnection.bizNetworkConnection.getParticipantRegistry("org.freshworks.User");
      const userResource = adminConnection.composerModelFactory.createUser(userPassport);
      
      // Add user resource to registry
      await userRegistry.add(userResource);
      
      // Issue identity to the new user using the admin connection
      const newIdentity = await adminConnection.bizNetworkConnection.issueIdentity(`org.freshworks.User#${userResource.userId}`, userResource.userId);
      
      // Import new card to hyperledger and the database
      await this.connectionManager.importNewIdCard(cardName, newIdentity.userSecret);
      
      // Create user in database
      await this.database.passportModel.create(userPassport);

      const { password, ...response } = userPassport;
      
      // Disconnect the admin connection
      adminConnection.disconnect();
      
      return res.status(200).json({ passport: response });
    } catch (error) {
      console.log('error: ', error);
      // TODO: delete card, user resource, and passport if anything fails
      return res.status(500).json({ error });
    }
  }

  test = async (req: Express.Request, res: Express.Response): Promise<Express.Response> => {
    try {
      const cardName = res.locals.userEmail;
      const connection = await this.connectionManager.createBusinessNetworkConnection(cardName);
      const registry = await connection.bizNetworkConnection.getIdentityRegistry();
      const data = await registry.getAll();
  
      return res.status(200).json({ data });
    } catch (error) {
      return res.status(500).json({ error: error.message || "Something went wrong" });
    }
  }

  /**
   * API route
   * 
   * Look up the passport with supplied user credentials.
   * Return token and passport information.
   * This token can be used for authentication for future REST server requests.
   */
  getToken = async (req: Express.Request, res: Express.Response): Promise<Express.Response> => {
    const email = req.body.email;
    const password = req.body.password;
    const passport: IPassport = await this.database.passportModel.findOne({ email });

    if (!passport) {
      return res.status(404).json({ message: "Passport not found" });
    }

    if (!passport.validatePassword(password)) {
      return res.status(400).json({ message: "Password is invalid" });
    }

    return res.status(200).json({
      token: this.generateToken(passport),
      firstName: passport.firstName,
      lastName: passport.lastName,
      email: passport.email,
    });
  }

  /**
   * API route
   * 
   * Get passport for user by token.
   */
  getPassport = async (req: Express.Request, res: Express.Response): Promise<Express.Response> => {
    const email = req.body.email;
    const passport: IPassport = await this.database.passportModel
      .findOne({ email })
      .select('-_id -__v -password');

    return res.status(200).json({ passport });
  }

  /**
   * Generate a Json Web Token for the user request.
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
