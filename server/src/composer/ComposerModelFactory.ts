import { ComposerModel } from './ComposerModel';

export class ComposerModelFactory {

  /**
   * Constructor for the ComposerModelFactory class
   */
  constructor(private businessNetworkDefinition: any) {}

  /**
   * Create new user Composer model entity for saving
   */
  createUser(user: any): any {
    const factory = this.businessNetworkDefinition.getFactory();
    // We create a new resource through the factory, we set the user.email as the resource identifier as specified in the cto model file
    const newUser = factory.newResource(ComposerModel.NAMESPACE, ComposerModel.PARTICIPANT.USER, user.email);

    newUser.firstName = user.firstName;
    newUser.lastName = user.lastName;

    return newUser;
  }

  /**
   * Update user Composer model entity, to be saved later
   */
  editUser(composerEntity: any, user: any) {
    composerEntity.firstName = user.firstName;
    composerEntity.lastName = user.lastName;

    return composerEntity;
  }

  /**
   * Create a new Hyperledger Composer concept
   */
  createConcept(conceptName: string): any {
    return this.businessNetworkDefinition.getFactory().newConcept(ComposerModel.NAMESPACE, conceptName);
  }

  /**
   * Create a new Hyperledger Composer relationship pointing to an asset or  participant
   */
  createRelationship(type: string, identifier: string): any {
    return this.businessNetworkDefinition.getFactory().newRelationship(ComposerModel.NAMESPACE, type, identifier);
  }
}
