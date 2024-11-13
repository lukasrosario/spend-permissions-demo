import { http } from "viem";
import { createPaymasterClient } from "viem/account-abstraction";

export function getPaymasterClient() {
  return createPaymasterClient({
    transport: http(process.env.BUNDLER_URL as string),
  });
}
