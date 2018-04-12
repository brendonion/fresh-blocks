import { BusinessNetworkConnection } from 'composer-client';
import { ComposerModelFactory } from './ComposerModelFactory';
import { ComposerModel, ComposerTypes } from './ComposerModel';

export class ComposerConnection {

  /**
   * Constructor
   * @param {BusinessNetworkConnection} bizNetworkConnection
   * @param businessNetworkDefinition
   * @param {ComposerModelFactory} composerModelFactory
   */
  constructor(
    public bizNetworkConnection: BusinessNetworkConnection,
    public businessNetworkDefinition: any,
    public composerModelFactory: ComposerModelFactory
  ) {}

  /**
   * Convert hyperledger composer ledger data to a usable json object
   * @param object
   * @returns {any}
   */
  serializeToJSON(object: any): any {
    return this.businessNetworkDefinition.getSerializer().toJSON(object);
  }

  /**
   * Convert JSON string to hyperledger composer ledger data
   * @param object
   * @param object
   * @returns {any}
   */
  serializeFromJSONObject(jsonObject: any): any {
    return this.businessNetworkDefinition.getSerializer().fromJSON(jsonObject);
  }

  /**
   * Execute a Hyperledger Composer query
   * @param {string} name
   * @param params
   */
  query(name: string, params: any = {}): any {
    return this.bizNetworkConnection.query(name, params);
  }

  /**
   * Execute a Hyperledger Composer Transaction
   * @param {string} resource
   */
  submitTransaction(resource: string): any {
    return this.bizNetworkConnection.submitTransaction(resource);
  }

  /**
   * Disconnect business network connection
   * @returns {Promise<void>}
   */
  disconnect(): Promise<void> {
    return this.bizNetworkConnection.disconnect();
  }

  /**
   * Get composer identity
   * @param {string} identityName
   * @returns {Promise<any>}
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
   * @param identity
   * @returns {Promise<void>}
   */
  revokeIdentity(identity: any): Promise<void> {
    return this.bizNetworkConnection.revokeIdentity(identity);
  }
}
