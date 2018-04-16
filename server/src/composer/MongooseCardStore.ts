import { IdCard, BusinessNetworkCardStore } from 'composer-common';
import { IDatabase } from '../database/database';
import { IComposerCard } from './card';

/**
 * Manages persistence of business network cards to a Mongo database
 * Extends BusinessNetworkCardStore form implementation
 */
export default class MongooseCardStore extends BusinessNetworkCardStore {

  /**
   * Constructor.
   */
  constructor(private database: IDatabase) {
    super();
  }

  /**
   * get card
   * @param cardName
   */
  get(cardName: string): Promise<IdCard | void> {
    console.log(`retrieving card ${cardName} ...`);
    return this.database.composerCardModel.findOne({ cardName }).lean(true)
      .then((composerCard: IComposerCard) => {
        if (composerCard) {
          console.log(`Card ${composerCard.userName} found`);
          return this.convertToIdCard(composerCard);
        } else {
          this.throwCardDoesNotExistError(cardName);
        }
      }).catch((err) => {
        this.throwCardDoesNotExistError(cardName);
      });
  }

  /**
   * put card into the store
   * @param cardName
   * @param card
   */
  put(cardName: string, card: IdCard) {
    console.log(`putting card ${cardName} ...`);
    return this.database.composerCardModel.find({ cardName })
      .then((composerCard) => {
        if (composerCard) {
          return this.database.composerCardModel.remove({ cardName });
        } else {
          return Promise.resolve();
        }
      })
      .then(() => card.toArchive({ type: 'nodebuffer' }))
      .then((cardData) => {
        const newComposerCard = {
          cardName,
          connectionProfile: JSON.stringify(card.getConnectionProfile()),
          businessNetwork: card.getBusinessNetworkName(),
          enrollmentSecret: card.getEnrollmentCredentials().secret,
          version: card['metadata'].version,
          roles: JSON.stringify(card.getRoles()),
          userName: card.getUserName(),
        };
        return this.database.composerCardModel.create(newComposerCard);
      });
  }

  /**
   * get all cards from store
   */
  getAll() {
    console.log(`getting all cards from store ...`);
    const result = new Map();
    this.database.composerCardModel.find().lean(true)
      .then((composerCards: IComposerCard[]) => {
        for (const composerCard of composerCards) {
          result.set(composerCard.cardName, this.convertToIdCard(composerCard));
        }
        return result;
      });
  }

  /**
   * delete card from store
   * @param cardName
   */
  delete(cardName) {
    console.log(`deleting card ${cardName} ...`);
    this.database.composerCardModel.findOneAndRemove({ cardName })
      .then((composerCard) => {
        return true;
      }).catch((err) => {
        this.throwCardDoesNotExistError(cardName);
      });
  }

  /**
   * Check if card is available in the store
   * @param cardName
   */
  has(cardName): boolean | void {
    console.log(`checking if card ${cardName} exists ...`);
    this.database.composerCardModel.findOne({ cardName }).lean(true)
      .then((composerCard) => {
        return composerCard !== null;
      }).catch((err) => {
        return false;
      });
  }

  getWallet() {}

  private throwCardDoesNotExistError(cardName: string) {
    const error: any = new Error(`The business network card "${cardName}" does not exist`);
    error.statusCode = error.status = 404;
    throw error;
  }

  private convertToIdCard(composerCard: IComposerCard): IdCard {
    const metadata = {
      version : composerCard.version,
      userName : composerCard.userName,
      businessNetwork : composerCard.businessNetwork,
      enrollmentSecret : composerCard.enrollmentSecret,
      roles: JSON.parse(composerCard.roles)
    };
    return new IdCard(metadata, JSON.parse(composerCard.connectionProfile));
  }
}
