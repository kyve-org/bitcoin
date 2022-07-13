import { DataItem, IRuntime, Node } from "@kyve/core";
import { name, version } from "../package.json";
import { fetchBlock, fetchBlockHash } from "./utils";

export default class Bitcoin implements IRuntime {
  public name = name;
  public version = version;

  public async getDataItem(core: Node, key: string): Promise<DataItem> {
    let hash: string;
    let block: any;

    const headers = await this.generateCoinbaseCloudHeaders(core);

    try {
      hash = await fetchBlockHash(core.poolConfig.rpc, +key, headers);
    } catch (err) {
      // The only time this should fail is if the height is out of range.
      throw err;
    }

    try {
      block = await fetchBlock(core.poolConfig.rpc, hash, headers);
    } catch (err) {
      throw err;
    }

    return { key, value: block };
  }

  public async getNextKey(key: string): Promise<string> {
    return (parseInt(key) + 1).toString();
  }

  public async formatValue(value: any): Promise<string> {
    return value.hash;
  }

  private async generateCoinbaseCloudHeaders(core: Node): Promise<any> {
    // requestSignature for coinbase cloud
    const address = core.client.account.address;
    const timestamp = new Date().valueOf().toString();
    const poolId = core.pool.id;

    const { signature, pub_key } = await core.client.signString(
      `${address}//${poolId}//${timestamp}`
    );

    return {
      "Content-Type": "application/json",
      Signature: signature,
      "Public-Key": pub_key,
      "Pool-ID": poolId,
      Timestamp: timestamp,
    };
  }
}
