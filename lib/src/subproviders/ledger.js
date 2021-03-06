"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LedgerSubprovider = void 0;
const assert_1 = require("@0x/assert");
const utils_1 = require("@0x/utils");
const common_1 = require("@ethereumjs/common");
const tx_1 = require("@ethereumjs/tx");
const ethUtil = require("ethereumjs-util");
const HDNode = require("hdkey");
const _ = require("lodash");
const semaphore_async_await_1 = require("semaphore-async-await");
const types_1 = require("../types");
const wallet_utils_1 = require("../utils/wallet_utils");
const base_wallet_subprovider_1 = require("./base_wallet_subprovider");
const DEFAULT_BASE_DERIVATION_PATH = `44'/60'/0'`;
const ASK_FOR_ON_DEVICE_CONFIRMATION = false;
const SHOULD_GET_CHAIN_CODE = true;
const DEFAULT_NUM_ADDRESSES_TO_FETCH = 10;
const DEFAULT_ADDRESS_SEARCH_LIMIT = 1000;
/**
 * Subprovider for interfacing with a user's [Ledger Nano S](https://www.ledgerwallet.com/products/ledger-nano-s).
 * This subprovider intercepts all account related RPC requests (e.g message/transaction signing, etc...) and
 * re-routes them to a Ledger device plugged into the users computer.
 */
class LedgerSubprovider extends base_wallet_subprovider_1.BaseWalletSubprovider {
    /**
     * Instantiates a LedgerSubprovider. Defaults to derivationPath set to `44'/60'/0'`.
     * TestRPC/Ganache defaults to `m/44'/60'/0'/0`, so set this in the configs if desired.
     * @param config Several available configurations
     * @return LedgerSubprovider instance
     */
    constructor(config) {
        super();
        // tslint:disable-next-line:no-unused-variable
        this._connectionLock = new semaphore_async_await_1.Lock();
        this._networkId = config.networkId;
        this._ledgerEthereumClientFactoryAsync = config.ledgerEthereumClientFactoryAsync;
        this._baseDerivationPath = config.baseDerivationPath || DEFAULT_BASE_DERIVATION_PATH;
        this._shouldAlwaysAskForConfirmation =
            config.accountFetchingConfigs !== undefined &&
                config.accountFetchingConfigs.shouldAskForOnDeviceConfirmation !== undefined
                ? config.accountFetchingConfigs.shouldAskForOnDeviceConfirmation
                : ASK_FOR_ON_DEVICE_CONFIRMATION;
        this._addressSearchLimit =
            config.accountFetchingConfigs !== undefined &&
                config.accountFetchingConfigs.addressSearchLimit !== undefined
                ? config.accountFetchingConfigs.addressSearchLimit
                : DEFAULT_ADDRESS_SEARCH_LIMIT;
        this._common = common_1.default.forCustomChain('mainnet', { chainId: this._networkId });
    }
    /**
     * Retrieve the set derivation path
     * @returns derivation path
     */
    getPath() {
        return this._baseDerivationPath;
    }
    /**
     * Set a desired derivation path when computing the available user addresses
     * @param basDerivationPath The desired derivation path (e.g `44'/60'/0'`)
     */
    setPath(basDerivationPath) {
        this._baseDerivationPath = basDerivationPath;
    }
    /**
     * Retrieve a users Ledger accounts. The accounts are derived from the derivationPath,
     * master public key and chain code. Because of this, you can request as many accounts
     * as you wish and it only requires a single request to the Ledger device. This method
     * is automatically called when issuing a `eth_accounts` JSON RPC request via your providerEngine
     * instance.
     * @param numberOfAccounts Number of accounts to retrieve (default: 10)
     * @return An array of accounts
     */
    getAccountsAsync(numberOfAccounts = DEFAULT_NUM_ADDRESSES_TO_FETCH) {
        return __awaiter(this, void 0, void 0, function* () {
            const initialDerivedKeyInfo = yield this._initialDerivedKeyInfoAsync();
            const derivedKeyInfos = wallet_utils_1.walletUtils.calculateDerivedHDKeyInfos(initialDerivedKeyInfo, numberOfAccounts);
            const accounts = _.map(derivedKeyInfos, k => k.address);
            return accounts;
        });
    }
    /**
     * Signs a transaction on the Ledger with the account specificed by the `from` field in txParams.
     * If you've added the LedgerSubprovider to your app's provider, you can simply send an `eth_sendTransaction`
     * JSON RPC request, and this method will be called auto-magically. If you are not using this via a ProviderEngine
     * instance, you can call it directly.
     * @param txParams Parameters of the transaction to sign
     * @return Signed transaction hex string
     */
    signTransactionAsync(txParams) {
        return __awaiter(this, void 0, void 0, function* () {
            LedgerSubprovider._validateTxParams(txParams);
            if (txParams.from === undefined || !utils_1.addressUtils.isAddress(txParams.from)) {
                throw new Error(types_1.WalletSubproviderErrors.FromAddressMissingOrInvalid);
            }
            // omit some properties from txParams.
            const _txParams = {
                to: txParams.to,
                gasLimit: txParams.gas,
                gasPrice: txParams.gasPrice,
                data: txParams.data,
                nonce: txParams.nonce,
                value: txParams.value,
            };
            const initialDerivedKeyInfo = yield this._initialDerivedKeyInfoAsync();
            const derivedKeyInfo = this._findDerivedKeyInfoForAddress(initialDerivedKeyInfo, txParams.from);
            this._ledgerClientIfExists = yield this._createLedgerClientAsync();
            const ledgerTxHex = (() => {
                const values = tx_1.Transaction.fromTxData(_txParams, { common: this._common }).raw();
                // tslint:disable-next-line: custom-no-magic-numbers
                values[6] = ethUtil.bnToRlp(new ethUtil.BN(this._networkId));
                return ethUtil.rlp.encode(values).toString('hex');
            })();
            try {
                const fullDerivationPath = derivedKeyInfo.derivationPath;
                const result = yield this._ledgerClientIfExists.signTransaction(fullDerivationPath, ledgerTxHex);
                const signedTx = tx_1.Transaction.fromTxData(Object.assign(Object.assign({}, _txParams), { r: `0x${result.r}`, s: `0x${result.s}`, v: `0x${result.v}` }), { common: this._common });
                // EIP155: v should be chain_id * 2 + {35, 36}
                const eip55Constant = 35;
                const signedChainId = Math.floor((ethUtil.toBuffer(signedTx.v)[0] - eip55Constant) / 2);
                if (signedChainId !== this._networkId) {
                    yield this._destroyLedgerClientAsync();
                    const err = new Error(types_1.LedgerSubproviderErrors.TooOldLedgerFirmware);
                    throw err;
                }
                const signedTxHex = `0x${signedTx.serialize().toString('hex')}`;
                yield this._destroyLedgerClientAsync();
                return signedTxHex;
            }
            catch (err) {
                yield this._destroyLedgerClientAsync();
                throw err;
            }
        });
    }
    /**
     * Sign a personal Ethereum signed message. The signing account will be the account
     * associated with the provided address.
     * The Ledger adds the Ethereum signed message prefix on-device.  If you've added
     * the LedgerSubprovider to your app's provider, you can simply send an `eth_sign`
     * or `personal_sign` JSON RPC request, and this method will be called auto-magically.
     * If you are not using this via a ProviderEngine instance, you can call it directly.
     * @param data Hex string message to sign
     * @param address Address of the account to sign with
     * @return Signature hex string (order: rsv)
     */
    signPersonalMessageAsync(data, address) {
        return __awaiter(this, void 0, void 0, function* () {
            if (data === undefined) {
                throw new Error(types_1.WalletSubproviderErrors.DataMissingForSignPersonalMessage);
            }
            assert_1.assert.isHexString('data', data);
            assert_1.assert.isETHAddressHex('address', address);
            const initialDerivedKeyInfo = yield this._initialDerivedKeyInfoAsync();
            const derivedKeyInfo = this._findDerivedKeyInfoForAddress(initialDerivedKeyInfo, address);
            this._ledgerClientIfExists = yield this._createLedgerClientAsync();
            try {
                const fullDerivationPath = derivedKeyInfo.derivationPath;
                const result = yield this._ledgerClientIfExists.signPersonalMessage(fullDerivationPath, ethUtil.stripHexPrefix(data));
                const lowestValidV = 27;
                const v = result.v - lowestValidV;
                const hexBase = 16;
                let vHex = v.toString(hexBase);
                if (vHex.length < 2) {
                    vHex = `0${v}`;
                }
                const signature = `0x${result.r}${result.s}${vHex}`;
                yield this._destroyLedgerClientAsync();
                return signature;
            }
            catch (err) {
                yield this._destroyLedgerClientAsync();
                throw err;
            }
        });
    }
    /**
     * eth_signTypedData is currently not supported on Ledger devices.
     * @param address Address of the account to sign with
     * @param data the typed data object
     * @return Signature hex string (order: rsv)
     */
    // tslint:disable-next-line:prefer-function-over-method
    signTypedDataAsync(address, typedData) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error(types_1.WalletSubproviderErrors.MethodNotSupported);
        });
    }
    _createLedgerClientAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._connectionLock.acquire();
            if (this._ledgerClientIfExists !== undefined) {
                this._connectionLock.release();
                throw new Error(types_1.LedgerSubproviderErrors.MultipleOpenConnectionsDisallowed);
            }
            const ledgerEthereumClient = yield this._ledgerEthereumClientFactoryAsync();
            this._connectionLock.release();
            return ledgerEthereumClient;
        });
    }
    _destroyLedgerClientAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._connectionLock.acquire();
            if (this._ledgerClientIfExists === undefined) {
                this._connectionLock.release();
                return;
            }
            yield this._ledgerClientIfExists.transport.close();
            this._ledgerClientIfExists = undefined;
            this._connectionLock.release();
        });
    }
    _initialDerivedKeyInfoAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            this._ledgerClientIfExists = yield this._createLedgerClientAsync();
            const parentKeyDerivationPath = `m/${this._baseDerivationPath}`;
            let ledgerResponse;
            try {
                ledgerResponse = yield this._ledgerClientIfExists.getAddress(parentKeyDerivationPath, this._shouldAlwaysAskForConfirmation, SHOULD_GET_CHAIN_CODE);
            }
            finally {
                yield this._destroyLedgerClientAsync();
            }
            const hdKey = new HDNode();
            hdKey.publicKey = Buffer.from(ledgerResponse.publicKey, 'hex');
            hdKey.chainCode = Buffer.from(ledgerResponse.chainCode, 'hex');
            const address = wallet_utils_1.walletUtils.addressOfHDKey(hdKey);
            const initialDerivedKeyInfo = {
                hdKey,
                address,
                derivationPath: parentKeyDerivationPath,
                baseDerivationPath: this._baseDerivationPath,
            };
            return initialDerivedKeyInfo;
        });
    }
    _findDerivedKeyInfoForAddress(initalHDKey, address) {
        const matchedDerivedKeyInfo = wallet_utils_1.walletUtils.findDerivedKeyInfoForAddressIfExists(address, initalHDKey, this._addressSearchLimit);
        if (matchedDerivedKeyInfo === undefined) {
            throw new Error(`${types_1.WalletSubproviderErrors.AddressNotFound}: ${address}`);
        }
        return matchedDerivedKeyInfo;
    }
}
exports.LedgerSubprovider = LedgerSubprovider;
//# sourceMappingURL=ledger.js.map