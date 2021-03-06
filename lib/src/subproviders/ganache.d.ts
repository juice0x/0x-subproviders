import { JSONRPCRequestPayload } from 'ethereum-types';
import * as Ganache from 'ganache-core';
import { Callback, ErrorCallback } from '../types';
import { Subprovider } from './subprovider';
/**
 * This class implements the [web3-provider-engine](https://github.com/MetaMask/provider-engine) subprovider interface.
 * It intercepts all JSON RPC requests and relays them to an in-process ganache instance.
 */
export declare class GanacheSubprovider extends Subprovider {
    private readonly _ganacheProvider;
    /**
     * Instantiates a GanacheSubprovider
     * @param opts The desired opts with which to instantiate the Ganache provider
     */
    constructor(opts: Ganache.GanacheOpts);
    /**
     * This method conforms to the web3-provider-engine interface.
     * It is called internally by the ProviderEngine when it is this subproviders
     * turn to handle a JSON RPC request.
     * @param payload JSON RPC payload
     * @param _next Callback to call if this subprovider decides not to handle the request
     * @param end Callback to call if subprovider handled the request and wants to pass back the request.
     */
    handleRequest(payload: JSONRPCRequestPayload, _next: Callback, end: ErrorCallback): Promise<void>;
}
//# sourceMappingURL=ganache.d.ts.map