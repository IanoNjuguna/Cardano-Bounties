const BLOCKFROST_PREPROD_BASE_URL = "https://cardano-preprod.blockfrost.io/api/v0";

type BlockfrostAmount = {
  unit: string;
  quantity: string;
};

type BlockfrostTx = {
  hash: string;
  block_height?: number | null;
};

type BlockfrostLatestBlock = {
  height?: number | null;
};

type BlockfrostTxUtxos = {
  outputs: Array<{
    address: string;
    amount: BlockfrostAmount[];
  }>;
};

export type EscrowVerificationResult =
  | { ok: true; confirmations: number; receivedLovelace: number }
  | { ok: false; error: string; status?: number };

function getBlockfrostProjectId() {
  return process.env.BLOCKFROST_PREPROD_PROJECT_ID || process.env.BLOCKFROST_PROJECT_ID || "";
}

function getMinConfirmations() {
  const configured = Number(process.env.BLOCKFROST_MIN_CONFIRMATIONS || "1");
  return Number.isFinite(configured) && configured > 0 ? Math.floor(configured) : 1;
}

async function blockfrostGet<T>(path: string): Promise<{ ok: true; data: T } | { ok: false; error: string; status: number }> {
  const projectId = getBlockfrostProjectId();

  if (!projectId) {
    return { ok: false, error: "Blockfrost project id is not configured", status: 500 };
  }

  const response = await fetch(`${BLOCKFROST_PREPROD_BASE_URL}${path}`, {
    headers: {
      project_id: projectId,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 404) {
      return {
        ok: false,
        error: "Transaction is not indexed by Blockfrost yet. Wait a few seconds and retry escrow recording.",
        status: 425,
      };
    }

    return {
      ok: false,
      error: `Blockfrost request failed with status ${response.status}`,
      status: response.status,
    };
  }

  return { ok: true, data: (await response.json()) as T };
}

export async function verifyEscrowPayment({
  txHash,
  escrowAddress,
  expectedLovelace,
}: {
  txHash: string;
  escrowAddress: string;
  expectedLovelace: number;
}): Promise<EscrowVerificationResult> {
  const [txResult, latestBlockResult, utxosResult] = await Promise.all([
    blockfrostGet<BlockfrostTx>(`/txs/${txHash}`),
    blockfrostGet<BlockfrostLatestBlock>("/blocks/latest"),
    blockfrostGet<BlockfrostTxUtxos>(`/txs/${txHash}/utxos`),
  ]);

  if (!txResult.ok) return txResult;
  if (!latestBlockResult.ok) return latestBlockResult;
  if (!utxosResult.ok) return utxosResult;

  const txBlockHeight = txResult.data.block_height;
  const latestBlockHeight = latestBlockResult.data.height;
  const confirmations =
    typeof txBlockHeight === "number" && typeof latestBlockHeight === "number"
      ? Math.max(0, latestBlockHeight - txBlockHeight + 1)
      : 0;

  if (confirmations < getMinConfirmations()) {
    return {
      ok: false,
      error: `Escrow transaction has ${confirmations} confirmation(s); ${getMinConfirmations()} required`,
      status: 425,
    };
  }

  const receivedLovelace = utxosResult.data.outputs
    .filter((output) => output.address === escrowAddress)
    .reduce((sum, output) => {
      const lovelace = output.amount.find((amount) => amount.unit === "lovelace");
      return sum + Number(lovelace?.quantity || "0");
    }, 0);

  if (receivedLovelace < expectedLovelace) {
    return {
      ok: false,
      error: `Escrow transaction paid ${receivedLovelace} lovelace; expected at least ${expectedLovelace}`,
      status: 400,
    };
  }

  return { ok: true, confirmations, receivedLovelace };
}
