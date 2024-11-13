"use client";

import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownLink,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import {
  Avatar,
  Name,
  Identity,
  EthBalance,
  Address as AddressComponent,
} from "@coinbase/onchainkit/identity";
import { useAccount, useSignTypedData, useSwitchChain } from "wagmi";
import { type Address, Hex, parseUnits } from "viem";
import { useEffect, useState } from "react";
import { spendPermissionManagerAddress } from "./abi/SpendPermissionManager";

type SpendPermission = {
  account: Address;
  spender: Address; // Spender smart contract wallet address
  token: Address; // ETH (https://eips.ethereum.org/EIPS/eip-7528)
  allowance: bigint;
  period: number; // seconds in a day
  start: number; // unix timestamp
  end: number; // max uint48
  salt: bigint;
  extraData: Hex;
};

export default function App() {
  const { address } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const { switchChain } = useSwitchChain();
  const [spendPermission, setSpendPermission] = useState<SpendPermission>();
  const [hashes, setHashes] = useState<string[] | undefined>(undefined);

  useEffect(() => {
    switchChain({ chainId: 84532 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (hashes?.length === 1) {
      setInterval(async () => {
        const response = await fetch("/collectPreApproved", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ spendPermission }, (_, v) =>
            typeof v === "bigint" ? v.toString() : v
          ),
        });

        const { hash: withdrawalHash } = await response.json();

        setHashes((hashes) => [...(hashes || []), withdrawalHash]);
      }, 5000);
    }
  }, [hashes]);

  const handleSubscribe = async () => {
    if (address) {
      const spendPermission = {
        account: address,
        spender: process.env.NEXT_PUBLIC_SPENDER_ADDRESS as Address, // Spender smart contract wallet address
        token: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as Address, // ETH (https://eips.ethereum.org/EIPS/eip-7528)
        allowance: parseUnits("10", 18),
        period: 86400, // seconds in a day
        start: 0, // unix timestamp
        end: 281474976710655, // max uint48
        salt: BigInt(0),
        extraData: "0x" as Hex,
      };

      const signature = await signTypedDataAsync({
        domain: {
          name: "Spend Permission Manager",
          version: "1",
          chainId: 84532,
          verifyingContract: spendPermissionManagerAddress,
        },
        types: {
          SpendPermission: [
            { name: "account", type: "address" },
            { name: "spender", type: "address" },
            { name: "token", type: "address" },
            { name: "allowance", type: "uint160" },
            { name: "period", type: "uint48" },
            { name: "start", type: "uint48" },
            { name: "end", type: "uint48" },
            { name: "salt", type: "uint256" },
            { name: "extraData", type: "bytes" },
          ],
        },
        primaryType: "SpendPermission",
        message: spendPermission,
      });

      const response = await fetch("/collect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ signature, spendPermission }, (_, v) =>
          typeof v === "bigint" ? v.toString() : v
        ),
      });

      const { hash: withdrawalHash } = await response.json();

      setSpendPermission(spendPermission);
      setHashes([withdrawalHash]);
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans dark:bg-background dark:text-white bg-white text-black">
      <header className="pt-4 pr-4">
        <div className="flex justify-end">
          <div className="wallet-container">
            <Wallet>
              <ConnectWallet>
                <Avatar className="h-6 w-6" />
                <Name />
              </ConnectWallet>
              <WalletDropdown>
                <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                  <Avatar />
                  <Name />
                  <AddressComponent />
                  <EthBalance />
                </Identity>
                <WalletDropdownLink
                  icon="wallet"
                  href="https://keys.coinbase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Wallet
                </WalletDropdownLink>
                <WalletDropdownDisconnect />
              </WalletDropdown>
            </Wallet>
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center">
        <button
          onClick={handleSubscribe}
          className="bg-blue-500 text-white rounded px-12 py-2"
        >
          Subscribe
        </button>
        {hashes &&
          hashes.map((hash, i) => (
            <a
              className="mt-4"
              key={hash}
              target="_blank"
              href={`https://base-sepolia.blockscout.com/op/${hash}`}
            >
              Withdrawal {i + 1}
            </a>
          ))}
      </main>
    </div>
  );
}
