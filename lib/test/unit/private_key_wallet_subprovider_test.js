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
const utils_1 = require("@0x/utils");
const common_1 = require("@ethereumjs/common");
const chai = require("chai");
const ethUtils = require("ethereumjs-util");
const src_1 = require("../../src/");
const types_1 = require("../../src/types");
const chai_setup_1 = require("../chai_setup");
const fixture_data_1 = require("../utils/fixture_data");
const report_callback_errors_1 = require("../utils/report_callback_errors");
// tslint:disable: custom-no-magic-numbers
chai_setup_1.chaiSetup.configure();
const expect = chai.expect;
describe('PrivateKeyWalletSubprovider', () => {
    let subprovider;
    let berlinSubprovider;
    let istanbulSubprovider;
    before(() => __awaiter(void 0, void 0, void 0, function* () {
        subprovider = new src_1.PrivateKeyWalletSubprovider(fixture_data_1.fixtureData.TEST_RPC_ACCOUNT_0_ACCOUNT_PRIVATE_KEY, fixture_data_1.fixtureData.NETWORK_ID);
        berlinSubprovider = new src_1.PrivateKeyWalletSubprovider(fixture_data_1.fixtureData.TEST_RPC_ACCOUNT_0_ACCOUNT_PRIVATE_KEY, fixture_data_1.fixtureData.NETWORK_ID, common_1.Hardfork.Berlin);
        istanbulSubprovider = new src_1.PrivateKeyWalletSubprovider(fixture_data_1.fixtureData.TEST_RPC_ACCOUNT_0_ACCOUNT_PRIVATE_KEY, fixture_data_1.fixtureData.NETWORK_ID, common_1.Hardfork.Istanbul);
    }));
    describe('direct method calls', () => {
        describe('success cases', () => {
            it('returns the account', () => __awaiter(void 0, void 0, void 0, function* () {
                const accounts = yield subprovider.getAccountsAsync();
                expect(accounts[0]).to.be.equal(fixture_data_1.fixtureData.TEST_RPC_ACCOUNT_0);
                expect(accounts.length).to.be.equal(1);
            }));
            it('signs a personal message', () => __awaiter(void 0, void 0, void 0, function* () {
                const data = ethUtils.bufferToHex(Buffer.from(fixture_data_1.fixtureData.PERSONAL_MESSAGE_STRING));
                const ecSignatureHex = yield subprovider.signPersonalMessageAsync(data, fixture_data_1.fixtureData.TEST_RPC_ACCOUNT_0);
                expect(ecSignatureHex).to.be.equal(fixture_data_1.fixtureData.PERSONAL_MESSAGE_SIGNED_RESULT);
            }));
            it('signs a transaction', () => __awaiter(void 0, void 0, void 0, function* () {
                const txHex = yield subprovider.signTransactionAsync(fixture_data_1.fixtureData.TX_DATA);
                expect(getSignedTransactionType(txHex)).to.eq(TransactionType.Legacy);
                expect(txHex).to.be.equal(fixture_data_1.fixtureData.TX_DATA_SIGNED_RESULT);
            }));
            it('signs an EIP2930 transaction', () => __awaiter(void 0, void 0, void 0, function* () {
                const txHex = yield subprovider.signTransactionAsync(fixture_data_1.fixtureData.TX_DATA_2930);
                expect(getSignedTransactionType(txHex)).to.eq(TransactionType.AccessList);
                expect(txHex).to.be.equal(fixture_data_1.fixtureData.TX_DATA_SIGNED_RESULT_2930);
            }));
            it('signs an EIP1559 transaction', () => __awaiter(void 0, void 0, void 0, function* () {
                const txHex = yield subprovider.signTransactionAsync(fixture_data_1.fixtureData.TX_DATA_1559);
                expect(getSignedTransactionType(txHex)).to.eq(TransactionType.FeeMarket);
                expect(txHex).to.be.equal(fixture_data_1.fixtureData.TX_DATA_SIGNED_RESULT_1559);
            }));
            it('ignores 1559 fields on a berlin hardfork', () => __awaiter(void 0, void 0, void 0, function* () {
                const txHex = yield berlinSubprovider.signTransactionAsync(fixture_data_1.fixtureData.TX_DATA_1559);
                expect(getSignedTransactionType(txHex)).to.eq(TransactionType.AccessList);
                expect(txHex).to.be.equal(fixture_data_1.fixtureData.TX_DATA_SIGNED_RESULT_2930);
            }));
            it('ignores 1559 and 2930 fields on an istanbul hardfork', () => __awaiter(void 0, void 0, void 0, function* () {
                const txHex = yield istanbulSubprovider.signTransactionAsync(fixture_data_1.fixtureData.TX_DATA_1559);
                expect(getSignedTransactionType(txHex)).to.eq(TransactionType.Legacy);
                expect(txHex).to.be.equal(fixture_data_1.fixtureData.TX_DATA_SIGNED_RESULT);
            }));
            it('signs a transaction where the tx.origin is checksummed.', () => __awaiter(void 0, void 0, void 0, function* () {
                const TX_DATA_CHECKSUMMED_ORIGIN = Object.assign(Object.assign({}, fixture_data_1.fixtureData.TX_DATA), { from: fixture_data_1.fixtureData.TEST_RPC_ACCOUNT_0_CHECKSUMMED });
                const txHex = yield subprovider.signTransactionAsync(TX_DATA_CHECKSUMMED_ORIGIN);
                expect(txHex).to.be.equal(fixture_data_1.fixtureData.TX_DATA_SIGNED_RESULT);
            }));
            it('signs an EIP712 sign typed data message', () => __awaiter(void 0, void 0, void 0, function* () {
                const signature = yield subprovider.signTypedDataAsync(fixture_data_1.fixtureData.TEST_RPC_ACCOUNT_0, fixture_data_1.fixtureData.EIP712_TEST_TYPED_DATA);
                expect(signature).to.be.equal(fixture_data_1.fixtureData.EIP712_TEST_TYPED_DATA_SIGNED_RESULT);
            }));
        });
    });
    describe('calls through a provider', () => {
        let provider;
        before(() => {
            provider = new src_1.Web3ProviderEngine();
            provider.addProvider(subprovider);
            provider.addProvider(new src_1.GanacheSubprovider({}));
            utils_1.providerUtils.startProviderEngine(provider);
        });
        describe('success cases', () => {
            it('returns a list of accounts', (done) => {
                const payload = {
                    jsonrpc: '2.0',
                    method: 'eth_accounts',
                    params: [],
                    id: 1,
                };
                const callback = report_callback_errors_1.reportCallbackErrors(done)((err, response) => {
                    expect(err).to.be.a('null');
                    expect(response.result[0]).to.be.equal(fixture_data_1.fixtureData.TEST_RPC_ACCOUNT_0);
                    expect(response.result.length).to.be.equal(1);
                    done();
                });
                provider.sendAsync(payload, callback);
            });
            it('signs a transaction', (done) => {
                const payload = {
                    jsonrpc: '2.0',
                    method: 'eth_signTransaction',
                    params: [fixture_data_1.fixtureData.TX_DATA],
                    id: 1,
                };
                const callback = report_callback_errors_1.reportCallbackErrors(done)((err, response) => {
                    expect(err).to.be.a('null');
                    expect(getSignedTransactionType(response.result.raw)).to.eq(TransactionType.Legacy);
                    expect(response.result.raw).to.be.equal(fixture_data_1.fixtureData.TX_DATA_SIGNED_RESULT);
                    done();
                });
                provider.sendAsync(payload, callback);
            });
            it('signs a personal message with eth_sign', (done) => {
                const messageHex = ethUtils.bufferToHex(Buffer.from(fixture_data_1.fixtureData.PERSONAL_MESSAGE_STRING));
                const payload = {
                    jsonrpc: '2.0',
                    method: 'eth_sign',
                    params: [fixture_data_1.fixtureData.TEST_RPC_ACCOUNT_0, messageHex],
                    id: 1,
                };
                const callback = report_callback_errors_1.reportCallbackErrors(done)((err, response) => {
                    expect(err).to.be.a('null');
                    expect(response.result).to.be.equal(fixture_data_1.fixtureData.PERSONAL_MESSAGE_SIGNED_RESULT);
                    done();
                });
                provider.sendAsync(payload, callback);
            });
            it('signs a personal message with personal_sign', (done) => {
                const messageHex = ethUtils.bufferToHex(Buffer.from(fixture_data_1.fixtureData.PERSONAL_MESSAGE_STRING));
                const payload = {
                    jsonrpc: '2.0',
                    method: 'personal_sign',
                    params: [messageHex, fixture_data_1.fixtureData.TEST_RPC_ACCOUNT_0],
                    id: 1,
                };
                const callback = report_callback_errors_1.reportCallbackErrors(done)((err, response) => {
                    expect(err).to.be.a('null');
                    expect(response.result).to.be.equal(fixture_data_1.fixtureData.PERSONAL_MESSAGE_SIGNED_RESULT);
                    done();
                });
                provider.sendAsync(payload, callback);
            });
            it('signs an EIP712 sign typed data message with eth_signTypedData', (done) => {
                const payload = {
                    jsonrpc: '2.0',
                    method: 'eth_signTypedData',
                    params: [fixture_data_1.fixtureData.TEST_RPC_ACCOUNT_0, fixture_data_1.fixtureData.EIP712_TEST_TYPED_DATA],
                    id: 1,
                };
                const callback = report_callback_errors_1.reportCallbackErrors(done)((err, response) => {
                    expect(err).to.be.a('null');
                    expect(response.result).to.be.equal(fixture_data_1.fixtureData.EIP712_TEST_TYPED_DATA_SIGNED_RESULT);
                    done();
                });
                provider.sendAsync(payload, callback);
            });
        });
        describe('failure cases', () => {
            it('should throw if `data` param not hex when calling eth_sign', (done) => {
                const nonHexMessage = 'hello world';
                const payload = {
                    jsonrpc: '2.0',
                    method: 'eth_sign',
                    params: [fixture_data_1.fixtureData.TEST_RPC_ACCOUNT_0, nonHexMessage],
                    id: 1,
                };
                const callback = report_callback_errors_1.reportCallbackErrors(done)((err, _response) => {
                    expect(err).to.not.be.a('null');
                    expect(err.message).to.be.equal('Expected data to be of type HexString, encountered: hello world');
                    done();
                });
                provider.sendAsync(payload, callback);
            });
            it('should throw if `data` param not hex when calling personal_sign', (done) => {
                const nonHexMessage = 'hello world';
                const payload = {
                    jsonrpc: '2.0',
                    method: 'personal_sign',
                    params: [nonHexMessage, fixture_data_1.fixtureData.TEST_RPC_ACCOUNT_0],
                    id: 1,
                };
                const callback = report_callback_errors_1.reportCallbackErrors(done)((err, _response) => {
                    expect(err).to.not.be.a('null');
                    expect(err.message).to.be.equal('Expected data to be of type HexString, encountered: hello world');
                    done();
                });
                provider.sendAsync(payload, callback);
            });
            it('should throw if `address` param is not the address from private key when calling personal_sign', (done) => {
                const messageHex = ethUtils.bufferToHex(Buffer.from(fixture_data_1.fixtureData.PERSONAL_MESSAGE_STRING));
                const payload = {
                    jsonrpc: '2.0',
                    method: 'personal_sign',
                    params: [messageHex, fixture_data_1.fixtureData.TEST_RPC_ACCOUNT_1],
                    id: 1,
                };
                const callback = report_callback_errors_1.reportCallbackErrors(done)((err, _response) => {
                    expect(err).to.not.be.a('null');
                    expect(err.message).to.be.equal(`Requested to sign message with address: ${fixture_data_1.fixtureData.TEST_RPC_ACCOUNT_1}, instantiated with address: ${fixture_data_1.fixtureData.TEST_RPC_ACCOUNT_0}`);
                    done();
                });
                provider.sendAsync(payload, callback);
            });
            it('should throw if `from` param missing when calling eth_sendTransaction', (done) => {
                const tx = {
                    to: '0xafa3f8684e54059998bc3a7b0d2b0da075154d66',
                    value: '0xde0b6b3a7640000',
                };
                const payload = {
                    jsonrpc: '2.0',
                    method: 'eth_sendTransaction',
                    params: [tx],
                    id: 1,
                };
                const callback = report_callback_errors_1.reportCallbackErrors(done)((err, _response) => {
                    expect(err).to.not.be.a('null');
                    expect(err.message).to.be.equal(types_1.WalletSubproviderErrors.SenderInvalidOrNotSupplied);
                    done();
                });
                provider.sendAsync(payload, callback);
            });
            it('should throw if `from` param invalid address when calling eth_sendTransaction', (done) => {
                const tx = {
                    to: '0xafa3f8684e54059998bc3a7b0d2b0da075154d66',
                    from: '0xIncorrectEthereumAddress',
                    value: '0xde0b6b3a7640000',
                };
                const payload = {
                    jsonrpc: '2.0',
                    method: 'eth_sendTransaction',
                    params: [tx],
                    id: 1,
                };
                const callback = report_callback_errors_1.reportCallbackErrors(done)((err, _response) => {
                    expect(err).to.not.be.a('null');
                    expect(err.message).to.be.equal(types_1.WalletSubproviderErrors.SenderInvalidOrNotSupplied);
                    done();
                });
                provider.sendAsync(payload, callback);
            });
            it('should throw if `address` param not found when calling personal_sign', (done) => {
                const messageHex = ethUtils.bufferToHex(Buffer.from(fixture_data_1.fixtureData.PERSONAL_MESSAGE_STRING));
                const payload = {
                    jsonrpc: '2.0',
                    method: 'personal_sign',
                    params: [messageHex, '0x0'],
                    id: 1,
                };
                const callback = report_callback_errors_1.reportCallbackErrors(done)((err, _response) => {
                    expect(err).to.not.be.a('null');
                    expect(err.message).to.be.equal(`Expected address to be of type ETHAddressHex, encountered: 0x0`);
                    done();
                });
                provider.sendAsync(payload, callback);
            });
        });
    });
});
var TransactionType;
(function (TransactionType) {
    TransactionType[TransactionType["Legacy"] = 0] = "Legacy";
    TransactionType[TransactionType["AccessList"] = 1] = "AccessList";
    TransactionType[TransactionType["FeeMarket"] = 2] = "FeeMarket";
})(TransactionType || (TransactionType = {}));
function getSignedTransactionType(signedData) {
    const prefix = parseInt(signedData.slice(2, 4), 16);
    // tslint:disable-next-line: number-literal-format
    if (prefix >= 0x7f) {
        return TransactionType.Legacy;
    }
    if (prefix === 0x1) {
        return TransactionType.AccessList;
    }
    if (prefix === 0x2) {
        return TransactionType.FeeMarket;
    }
    throw new Error(`Unknown signed tx prefix: ${prefix.toString(16)}`);
}
//# sourceMappingURL=private_key_wallet_subprovider_test.js.map