import { NextRequest, NextResponse } from "next/server";
import { getSpenderAccount } from "../util/getSpenderAccount";
import { getBundlerClient } from "../util/getBundlerClient";
import { getPaymasterClient } from "../util/getPaymasterClient";
import {
  spendPermissionManagerAbi,
  spendPermissionManagerAddress,
} from "../abi/SpendPermissionManager";

export async function POST(req: NextRequest) {
  try {
    const spenderAccount = await getSpenderAccount();
    const bundlerClient = getBundlerClient();
    const paymasterClient = getPaymasterClient();

    const { spendPermission } = await req.json();

    const hash = await bundlerClient.sendUserOperation({
      account: spenderAccount,
      calls: [
        {
          abi: spendPermissionManagerAbi,
          to: spendPermissionManagerAddress,
          functionName: "spend",
          args: [spendPermission, BigInt(100)],
        },
      ],
      paymaster: paymasterClient,
    });

    return NextResponse.json({
      status: "OK",
      hash,
    });
  } catch {
    return NextResponse.json({
      status: "ERROR",
    });
  }
}
