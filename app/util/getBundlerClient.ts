import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { createBundlerClient } from "viem/account-abstraction";

export function getBundlerClient() {
  const client = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  return createBundlerClient({
    client,
    transport: http(process.env.BUNDLER_URL as string),
  });
}
