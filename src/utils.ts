import axios from "axios";
import { nanoid } from "nanoid";
import { Response, Signature } from "./types";

export async function fetchBlock(
  endpoint: string,
  hash: string,
  signature: Signature
): Promise<any> {
  const block = await call<any>(endpoint, "getblock", [hash, 2], signature);

  // Remove confirmations to maintain determinism.
  delete block.confirmations;

  return block;
}

export async function fetchBlockHash(
  endpoint: string,
  height: number,
  signature: Signature
): Promise<string> {
  return await call<string>(endpoint, "getblockhash", [height], signature);
}

async function call<T>(
  endpoint: string,
  method: string,
  params: any[],
  signature: Signature
): Promise<T> {
  const { data } = await axios.get<Response<T>>(endpoint, {
    data: JSON.stringify({
      jsonrpc: "1.0",
      id: nanoid(),
      method,
      params,
    }),
    headers: {
      Signature: signature.signature,
      "Public-Key": signature.pubKey,
      "Pool-ID": signature.poolId,
      Timestamp: signature.timestamp,
      "Content-Type": "application/json",
    },
  });

  return data.result;
}
