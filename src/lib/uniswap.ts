import { encodeFunctionData, parseUnits, formatUnits, type Address } from "viem";
import { UNISWAP, TOKENS, DECIMALS, getNetworkConfig } from "./constants";
import { UNISWAP_ROUTER_ABI, UNISWAP_QUOTER_ABI, ERC20_ABI } from "./abis";
import { createPublicClient, http } from "viem";

const config = getNetworkConfig();

// Create a public client for reading from the chain
function getPublicClient() {
    return createPublicClient({
        chain: config.chain,
        transport: http(config.rpcUrl),
    });
}

export interface SwapQuote {
    amountIn: bigint;
    amountOut: bigint;
    amountOutFormatted: string;
    priceImpact: number;
    poolFee: number;
}

export interface SwapParams {
    tokenIn: Address;
    tokenOut: Address;
    amountIn: bigint;
    amountOutMinimum: bigint;
    recipient: Address;
    deadline: bigint;
    fee: number;
}

/**
 * Get a swap quote from Uniswap V3 Quoter
 */
export async function getSwapQuote(
    tokenIn: Address,
    tokenOut: Address,
    amountIn: string,
    decimalsIn: number = DECIMALS.USDT
): Promise<SwapQuote | null> {
    try {
        const publicClient = getPublicClient();
        const amountInWei = parseUnits(amountIn, decimalsIn);

        // Call the quoter contract
        const amountOut = await publicClient.readContract({
            address: UNISWAP.QUOTER as Address,
            abi: UNISWAP_QUOTER_ABI,
            functionName: "quoteExactInputSingle",
            args: [tokenIn, tokenOut, UNISWAP.POOL_FEE, amountInWei, BigInt(0)],
        });

        const amountOutFormatted = formatUnits(amountOut as bigint, DECIMALS.XAUT0);

        // Calculate simple price impact (simplified)
        const priceImpact = 0.3; // Placeholder - would need pool state for accurate calculation

        return {
            amountIn: amountInWei,
            amountOut: amountOut as bigint,
            amountOutFormatted,
            priceImpact,
            poolFee: UNISWAP.POOL_FEE / 10000, // Convert to percentage
        };
    } catch (error) {
        console.error("Error getting swap quote:", error);
        return null;
    }
}

/**
 * Calculate swap output with slippage for local/fallback mode
 */
export function calculateSwapOutputFallback(
    inputAmount: string,
    inputPrice: number,
    outputPrice: number,
    slippage: number = 0.005
): string {
    const input = parseFloat(inputAmount);
    if (isNaN(input) || input <= 0) return "0";

    const outputValue = (input * inputPrice) / outputPrice;
    const outputWithSlippage = outputValue * (1 - slippage);
    return outputWithSlippage.toFixed(6);
}

/**
 * Build the approval transaction for token spending
 */
export function buildApprovalTransaction(
    tokenAddress: Address,
    spenderAddress: Address,
    amount: bigint
) {
    return {
        to: tokenAddress,
        data: encodeFunctionData({
            abi: ERC20_ABI,
            functionName: "approve",
            args: [spenderAddress, amount],
        }),
        value: BigInt(0),
    };
}

/**
 * Build the swap transaction for Uniswap V3 exactInputSingle
 */
export function buildSwapTransaction(params: SwapParams) {
    const swapParams = {
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        fee: params.fee,
        recipient: params.recipient,
        deadline: params.deadline,
        amountIn: params.amountIn,
        amountOutMinimum: params.amountOutMinimum,
        sqrtPriceLimitX96: BigInt(0), // No price limit
    };

    return {
        to: UNISWAP.ROUTER as Address,
        data: encodeFunctionData({
            abi: UNISWAP_ROUTER_ABI,
            functionName: "exactInputSingle",
            args: [swapParams],
        }),
        value: BigInt(0),
    };
}

/**
 * Build a bundled approval + swap transaction array for smart wallet
 */
export function buildSwapBundle(
    tokenIn: Address,
    tokenOut: Address,
    amountIn: bigint,
    amountOutMinimum: bigint,
    recipient: Address,
    slippagePercent: number = 0.5
): Array<{ to: Address; data: `0x${string}`; value: bigint }> {
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800); // 30 minutes

    // For low-liquidity pools, use a very low minimum to test
    // Apply slippage: for 3% slippage, multiply by 97%
    const slippageMultiplier = BigInt(Math.floor((100 - slippagePercent) * 100));
    const minOutputWithSlippage = (amountOutMinimum * slippageMultiplier) / BigInt(10000);

    // For testing: set to 1 to accept any output (comment out for production)
    const testMinOutput = BigInt(1); // Accept any output for testing

    console.log(`🔄 Swap: ${amountIn} → min ${minOutputWithSlippage} (using test min: ${testMinOutput})`);

    // Build approval transaction
    const approvalTx = buildApprovalTransaction(
        tokenIn,
        UNISWAP.ROUTER as Address,
        amountIn
    );

    // Build swap transaction
    const swapTx = buildSwapTransaction({
        tokenIn,
        tokenOut,
        amountIn,
        amountOutMinimum: testMinOutput, // Use testMinOutput for debugging
        recipient,
        deadline,
        fee: UNISWAP.POOL_FEE,
    });

    return [approvalTx, swapTx] as Array<{ to: Address; data: `0x${string}`; value: bigint }>;
}

/**
 * Check if the user has sufficient allowance for the swap
 */
export async function checkAllowance(
    tokenAddress: Address,
    ownerAddress: Address,
    spenderAddress: Address
): Promise<bigint> {
    try {
        const publicClient = getPublicClient();

        const allowance = await publicClient.readContract({
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: "allowance",
            args: [ownerAddress, spenderAddress],
        });

        return allowance as bigint;
    } catch (error) {
        console.error("Error checking allowance:", error);
        return BigInt(0);
    }
}
