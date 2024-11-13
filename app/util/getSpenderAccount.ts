import { createPublicClient, http } from "viem";
import { toCoinbaseSmartAccount } from "viem/account-abstraction";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

export async function getSpenderAccount() {
  return await toCoinbaseSmartAccount({
    client: createPublicClient({ chain: baseSepolia, transport: http() }),
    owners: [
      privateKeyToAccount(process.env.SPENDER_PRIVATE_KEY as `0x${string}`),
    ],
  });
}
