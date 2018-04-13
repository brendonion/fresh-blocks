import { BusinessNetworkConnection } from 'composer-client';
import { ComposerModelFactory } from './ComposerModelFactory';
import { ComposerModel, ComposerTypes } from './ComposerModel';

export class ComposerConnection {

  /**
   * Constructor
   */
  constructor(
    public bizNetworkConnection: BusinessNetworkConnection,
    public businessNetworkDefinition: any,
    public composerModelFactory: ComposerModelFactory
  ) {}

  /**
   * Convert hyperledger composer ledger data to a usable json object
   */
  serializeToJSON(object: any): any {
    return this.businessNetworkDefinition.getSerializer().toJSON(object);
  }

  /**
   * Convert JSON string to hyperledger composer ledger data
   */
  serializeFromJSONObject(jsonObject: any): any {
    return this.businessNetworkDefinition.getSerializer().fromJSON(jsonObject);
  }

  /**
   * Execute a Hyperledger Composer query
   */
  query(name: string, params: any = {}): any {
    return this.bizNetworkConnection.query(name, params);
  }

  /**
   * Execute a Hyperledger Composer Transaction
   */
  submitTransaction(resource: string): any {
    return this.bizNetworkConnection.submitTransaction(resource);
  }

  /**
   * Disconnect business network connection
   */
  disconnect(): Promise<void> {
    return this.bizNetworkConnection.disconnect();
  }

  /**
   * Get composer identity
   */
  getIdentity(identityName: string): Promise<any> {
    return this.bizNetworkConnection.getIdentityRegistry()
      .then((identityRegistry) => identityRegistry.getAll())
      .then((identities) => {
        let id = null;
        for (let i = 0; i < identities.length; i++) {
          if (identityName === identities[i].name) {
            id = identities[i];
            break;
          }
        }
        return id;
      });
  }

  /**
   * Revoke composer identity
   */
  revokeIdentity(identity: any): Promise<void> {
    return this.bizNetworkConnection.revokeIdentity(identity);
  }
}
