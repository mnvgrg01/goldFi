import { COW_SWAP, TOKENS, DECIMALS } from "@/lib/constants";
import { parseUnits, formatUnits } from "viem";

export interface QuoteRequest {
  sellToken: string;
  buyToken: string;
  sellAmount?: string;
  buyAmount?: string;
  from: string;
  receiver?: string;
  validTo?: number;
  appData?: string;
  partiallyFillable?: boolean;
}

export interface QuoteResponse {
  quote: {
    sellToken: string;
    buyToken: string;
    receiver: string;
    sellAmount: string;
    buyAmount: string;
    validTo: number;
    appData: string;
    feeAmount: string;
    kind: string;
    partiallyFillable: boolean;
    sellTokenBalance: string;
    buyTokenBalance: string;
    signingScheme: string;
  };
  from: string;
}

export async function getCowSwapQuote(
  sellToken: string,
  buyToken: string,
  sellAmount: string,
  fromAddress: string
): Promise<QuoteResponse | null> {
  try {
    const sellAmountRaw = parseUnits(sellAmount, DECIMALS.USDT).toString();
    
    const quoteRequest: QuoteRequest = {
      sellToken,
      buyToken,
      sellAmount: sellAmountRaw,
      from: fromAddress,
      receiver: fromAddress,
      validTo: Math.floor(Date.now() / 1000) + 600, // 10 minutes
      appData: "0x",
      partiallyFillable: false,
    };

    const response = await fetch(COW_SWAP.QUOTE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(quoteRequest),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("CoW Swap quote error:", error);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error getting CoW Swap quote:", error);
    return null;
  }
}

export async function createCowSwapOrder(
  quote: QuoteResponse,
  signature: string,
  fromAddress: string
): Promise<string | null> {
  try {
    const order = {
      ...quote.quote,
      from: fromAddress,
      signature,
      signingScheme: "eip712",
    };

    const response = await fetch(COW_SWAP.ORDER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("CoW Swap order error:", error);
      return null;
    }

    const orderUid = await response.json();
    return orderUid;
  } catch (error) {
    console.error("Error creating CoW Swap order:", error);
    return null;
  }
}

export function formatCowSwapAmount(amount: string, decimals: number): string {
  return formatUnits(BigInt(amount), decimals);
}

// Fallback: Simple swap calculation using price ratio
export function calculateSwapOutput(
  inputAmount: string,
  inputPrice: number,
  outputPrice: number,
  slippage: number = 0.005
): string {
  const input = parseFloat(inputAmount);
  const outputValue = (input * inputPrice) / outputPrice;
  const outputWithSlippage = outputValue * (1 - slippage);
  return outputWithSlippage.toFixed(6);
}
