import { ECSignature } from '@0x/types';
import { Hardfork } from '@ethereumjs/common';
import { JSONRPCRequestPayload } from 'ethereum-types';
import HDNode = require('hdkey');
export interface LedgerCommunicationClient {
    close: () => Promise<void>;
}
/**
 * Elliptic Curve signature
 * The LedgerEthereumClient sends Ethereum-specific requests to the Ledger Nano S
 * It uses an internal LedgerCommunicationClient to relay these requests. Currently
 * NodeJs and Browser communication are supported.
 */
export interface LedgerEthereumClient {
    getAddress: (derivationPath: string, askForDeviceConfirmation: boolean, shouldGetChainCode: true) => Promise<LedgerGetAddressResult>;
    signTransaction: (derivationPath: string, rawTxHex: string) => Promise<ECSignatureString>;
    signPersonalMessage: (derivationPath: string, messageHex: string) => Promise<ECSignature>;
    transport: LedgerCommunicationClient;
}
export interface ECSignatureString {
    v: string;
    r: string;
    s: string;
}
export declare type LedgerEthereumClientFactoryAsync = () => Promise<LedgerEthereumClient>;
/**
 * networkId: The ethereum networkId to set as the chainId from EIP155
 * ledgerConnectionType: Environment in which you wish to connect to Ledger (nodejs or browser)
 * derivationPath: Initial derivation path to use e.g 44'/60'/0'
 * accountFetchingConfigs: configs related to fetching accounts from a Ledger
 */
export interface LedgerSubproviderConfigs {
    networkId: number;
    ledgerEthereumClientFactoryAsync: LedgerEthereumClientFactoryAsync;
    baseDerivationPath?: string;
    accountFetchingConfigs?: AccountFetchingConfigs;
}
/**
 * addressSearchLimit: The maximum number of addresses to search through, defaults to 1000
 * numAddressesToReturn: Number of addresses to return from 'eth_accounts' call
 * shouldAskForOnDeviceConfirmation: Whether you wish to prompt the user on their Ledger
 *                                   before fetching their addresses
 */
export interface AccountFetchingConfigs {
    addressSearchLimit?: number;
    numAddressesToReturn?: number;
    shouldAskForOnDeviceConfirmation?: boolean;
}
/**
 * mnemonic: The string mnemonic seed
 * addressSearchLimit: The maximum number of addresses to search through, defaults to 1000
 * baseDerivationPath: The base derivation path (e.g 44'/60'/0'/0)
 * chainId: The chain ID. Defaults to 1 (mainnet).
 * hardfork: The chain's active hardfork. Defaults to istanbul.
 */
export interface MnemonicWalletSubproviderConfigs {
    mnemonic: string;
    addressSearchLimit?: number;
    baseDerivationPath?: string;
    chainId?: number;
    hardfork?: Hardfork;
}
export interface SignatureData {
    hash: string;
    r: string;
    s: string;
    v: number;
}
export interface LedgerGetAddressResult {
    address: string;
    publicKey: string;
    chainCode: string;
}
export interface PartialTxParams {
    nonce: string;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    gas: string;
    to: string;
    from: string;
    value?: string;
    data?: string;
    type?: number;
    accessList?: Array<{
        address: string;
        storageKeys: string[];
    }>;
}
export declare type DoneCallback = (err?: Error) => void;
export interface LedgerCommunication {
    close_async: () => Promise<void>;
}
export interface ResponseWithTxParams {
    raw: string;
    tx: PartialTxParams;
}
export declare enum WalletSubproviderErrors {
    AddressNotFound = "ADDRESS_NOT_FOUND",
    DataMissingForSignPersonalMessage = "DATA_MISSING_FOR_SIGN_PERSONAL_MESSAGE",
    DataMissingForSignTypedData = "DATA_MISSING_FOR_SIGN_TYPED_DATA",
    SenderInvalidOrNotSupplied = "SENDER_INVALID_OR_NOT_SUPPLIED",
    FromAddressMissingOrInvalid = "FROM_ADDRESS_MISSING_OR_INVALID",
    MethodNotSupported = "METHOD_NOT_SUPPORTED"
}
export declare enum LedgerSubproviderErrors {
    TooOldLedgerFirmware = "TOO_OLD_LEDGER_FIRMWARE",
    MultipleOpenConnectionsDisallowed = "MULTIPLE_OPEN_CONNECTIONS_DISALLOWED"
}
export declare enum NonceSubproviderErrors {
    EmptyParametersFound = "EMPTY_PARAMETERS_FOUND",
    CannotDetermineAddressFromPayload = "CANNOT_DETERMINE_ADDRESS_FROM_PAYLOAD"
}
export interface DerivedHDKeyInfo {
    address: string;
    baseDerivationPath: string;
    derivationPath: string;
    hdKey: HDNode;
}
export declare type ErrorCallback = (err: Error | null, data?: any) => void;
export declare type Callback = () => void;
export declare type OnNextCompleted = (err: Error | null, result: any, cb: Callback) => void;
export declare type NextCallback = (callback?: OnNextCompleted) => void;
export interface JSONRPCRequestPayloadWithMethod extends JSONRPCRequestPayload {
    method: string;
}
export interface TrezorSubproviderConfig {
    accountFetchingConfigs: AccountFetchingConfigs;
    trezorConnectClientApi: any;
    networkId: number;
}
export interface TrezorGetPublicKeyResponsePayload {
    path: {
        [index: number]: number;
    };
    serializedPath: string;
    childNumb: number;
    xpub: string;
    chainCode: string;
    publicKey: string;
    fingerprint: number;
    depth: number;
}
export interface TrezorSignTxResponsePayload {
    v: string;
    r: string;
    s: string;
}
export interface TrezorSignMsgResponsePayload {
    address: string;
    signature: string;
}
export interface TrezorResponseErrorPayload {
    error: string;
}
export interface TrezorConnectResponse {
    payload: any;
    id: number;
    success: boolean;
}
export interface LatticeSubproviderConfig {
    latticeConnectClient: any;
    networkId: number;
    appName: string;
}
//# sourceMappingURL=types.d.ts.map