import { OpenPGPKey } from 'pmcrypto';
import { addKeyAction } from 'proton-shared/lib/keys/keysAction';
import { getDefaultKeyFlags } from 'proton-shared/lib/keys/keyFlags';
import getSignedKeyList from 'proton-shared/lib/keys/getSignedKeyList';
import { createAddressKeyRoute } from 'proton-shared/lib/api/keys';
import { Address, ActionableKey, Api, CachedKey } from 'proton-shared/lib/interfaces';

interface CreateKeyArguments {
    api: Api;
    signingKey: OpenPGPKey;
    privateKey: OpenPGPKey;
    privateKeyArmored: string;
    parsedKeys: CachedKey[];
    actionableKeys: ActionableKey[];
    Address: Address;
}
export default async ({
    api,
    privateKey,
    privateKeyArmored,
    signingKey,
    parsedKeys,
    actionableKeys,
    Address,
}: CreateKeyArguments) => {
    const updatedKeys = addKeyAction({
        ID: 'temp',
        flags: getDefaultKeyFlags(),
        parsedKeys,
        actionableKeys,
        privateKey,
    });

    const createdKey = updatedKeys.find(({ ID }) => ID === 'temp');
    if (!createdKey) {
        throw new Error('Temp key not found');
    }
    const { primary } = createdKey;

    const { Key } = await api(
        createAddressKeyRoute({
            AddressID: Address.ID,
            Primary: primary,
            PrivateKey: privateKeyArmored,
            SignedKeyList: await getSignedKeyList(updatedKeys, signingKey),
        })
    );

    // Mutably update the key with the latest value from the real ID.
    createdKey.ID = Key.ID;

    return updatedKeys;
};
