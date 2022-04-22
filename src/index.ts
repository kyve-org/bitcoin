import KYVE from "@kyve/core";
import { Signature } from "./types";
import { fetchBlock, fetchBlockHash } from "./utils";
import { version } from "../package.json";

process.env.KYVE_RUNTIME = "@kyve/bitcoin";
process.env.KYVE_VERSION = version;

KYVE.metrics.register.setDefaultLabels({
  app: process.env.KYVE_RUNTIME,
});

class KyveBitcoin extends KYVE {
  public async getDataItem(key: number): Promise<{ key: number; value: any }> {
    let hash: string;
    let block: any;

    try {
      hash = await fetchBlockHash(
        this.pool.config.rpc,
        key,
        await this.getSignature()
      );
    } catch (err) {
      // The only time this should fail is if the height is out of range.

      throw err;
    }

    try {
      block = await fetchBlock(
        this.pool.config.rpc,
        hash,
        await this.getSignature()
      );
    } catch (err) {
      this.logger.warn(
        `⚠️  EXTERNAL ERROR: Failed to fetch block ${key}. Retrying ...`
      );

      throw err;
    }

    return { key, value: block };
  }

  private async getSignature(): Promise<Signature> {
    const address = await this.sdk.wallet.getAddress();
    const timestamp = new Date().valueOf().toString();

    const message = `${address}//${this.poolId}//${timestamp}`;

    const { signature, pub_key } = await this.sdk.signString(message);

    return {
      signature,
      pubKey: pub_key.value,
      poolId: this.poolId.toString(),
      timestamp,
    };
  }
}

// noinspection JSIgnoredPromiseFromCall
new KyveBitcoin().start();
