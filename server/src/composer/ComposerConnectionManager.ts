import { AdminConnection } from "composer-admin";
import { BusinessNetworkConnection } from "composer-client";
import { IdCard } from "composer-common";
import { ComposerConnection } from "./ComposerConnection";
import { ComposerModelFactory } from "./ComposerModelFactory";
import MongooseCardStore from "./MongooseCardStore";
import { IDatabase } from "../database/database";

export default class ComposerConnectionManager {

  static BUSINESS_NETWORK = "freshblocks";
  static CONNECTION_PROFILE = {
    "name": "hlfv1",
    "x-type": "hlfv1",
    "x-commitTimeout": 300,
    "version": "1.0.0",
    "client": {
      "organization": "Org1",
      "connection": {
        "timeout": {
          "peer": {
            "endorser": "300",
            "eventHub": "300",
            "eventReg": "300"
          },
          "orderer": "300"
        }
      }
    },
    "channels": {
      "composerchannel": {
        "orderers": [
          "orderer.example.com"
        ],
        "peers": {
          "peer0.org1.example.com": {}
        }
      }
    },
    "organizations": {
      "Org1": {
        "mspid": "Org1MSP",
        "peers": [
          "peer0.org1.example.com"
        ],
        "certificateAuthorities": [
          "ca.org1.example.com"
        ]
      }
    },
    "orderers": {
      "orderer.example.com": {
        "url": "grpc://localhost:7050"
      }
    },
    "peers": {
      "peer0.org1.example.com": {
        "url": "grpc://localhost:7051",
        "eventUrl": "grpc://localhost:7053"
      }
    },
    "certificateAuthorities": {
      "ca.org1.example.com": {
        "url": "http://localhost:7054",
        "caName": "ca.org1.example.com"
      }
    }
  };

  private cardStore: MongooseCardStore;

  /**
   * Constructor for ComposerConnectionManager
   */
  constructor(private database: IDatabase) {
    this.cardStore = new MongooseCardStore(database);
  }

  /**
   * Create a new business network connection to the Hyperledger Fabric network for a specific user
   */
  createBusinessNetworkConnection(cardName: string): Promise<ComposerConnection> {
    const bizNetworkConnection = new BusinessNetworkConnection({ cardStore: this.cardStore });
    return new Promise<ComposerConnection>((resolve, reject) => {
      bizNetworkConnection.connect(cardName)
        .then((businessNetworkDefinition) => {
          resolve(new ComposerConnection(bizNetworkConnection, businessNetworkDefinition, new ComposerModelFactory(businessNetworkDefinition)));
        }).catch((error) => {
          console.log(`Something went wrong while connecting to business network ${error}`);
          reject(error);
        });
    });
  }

  /**
   * Import a new id card into Hyperledger Composer
   */
  importNewIdCard(cardName: string, enrollmentSecret: string): Promise<any> {
    const adminConnection = new AdminConnection({ cardStore: this.cardStore });
    const idCard = new IdCard(
      { 
        userName: cardName, 
        enrollmentSecret: enrollmentSecret, 
        businessNetwork: ComposerConnectionManager.BUSINESS_NETWORK 
      }, 
      ComposerConnectionManager.CONNECTION_PROFILE
    );
    return adminConnection.importCard(cardName.trim(), idCard);
  }

  /**
   * Import a new id card into Hyperledger Composer
   * This requires an admin connection instead of normal business network connection
   */
  importIdCard(cardName: string, card: IdCard): Promise<any> {
    const adminConnection = new AdminConnection({ cardStore: this.cardStore });
    return adminConnection.importCard(cardName.trim(), card);
  }
  
  getCard(cardName: string) {
    return this.cardStore.get(cardName);
  }
}
