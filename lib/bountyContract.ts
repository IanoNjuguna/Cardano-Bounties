export const BOUNTY_STATUS = {
  PendingEscrow: "pending_escrow",
  AwaitingAdminReview: "awaiting_admin_review",
  Open: "open",
  Completed: "completed",
  Cancelled: "cancelled",
  Rejected: "rejected",
  Expired: "expired",
} as const;

export const SUBMISSION_STATUS = {
  Pending: "pending",
  Approved: "approved",
  Rejected: "rejected",
  Closed: "closed",
  Paid: "paid",
} as const;

export const PLATFORM_FEE_RATE = 0.1;
export const MAX_REWARD_ADA = 1_000_000;
export const MIN_TITLE_LENGTH = 8;
export const MAX_TITLE_LENGTH = 120;
export const MIN_TYPE_LENGTH = 3;
export const MAX_TYPE_LENGTH = 80;
export const MIN_DESCRIPTION_LENGTH = 40;
export const MAX_DESCRIPTION_LENGTH = 2000;

const TX_HASH_PATTERN = /^[0-9a-f]{64}$/i;

export type BountyStatus = (typeof BOUNTY_STATUS)[keyof typeof BOUNTY_STATUS];

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string; field?: string };

export type CreateBountyInput = {
  title: string;
  description: string;
  type: string;
  reward_amount: number;
  platform_fee_amount: number;
  total_funding_amount: number;
  deadline: string | null;
  project_id: string | null;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isValidDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isPastDateOnly(value: string) {
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const [year, month, day] = value.split("-").map(Number);
  const deadlineUtc = Date.UTC(year, month - 1, day);

  return deadlineUtc < todayUtc;
}

function roundAda(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000;
}

export function getFundingBreakdown(rewardAmount: number) {
  const reward = roundAda(rewardAmount);
  const platformFee = roundAda(reward * PLATFORM_FEE_RATE);
  const totalFunding = roundAda(reward + platformFee);

  return {
    reward,
    platformFee,
    totalFunding,
  };
}

export function validateCreateBountyPayload(body: unknown): ValidationResult<CreateBountyInput> {
  if (!isPlainObject(body)) {
    return { ok: false, error: "Request body must be a JSON object." };
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const type = typeof body.type === "string" ? body.type.trim() : "";
  const rewardAmount = Number(body.reward_amount);
  const requestedPlatformFee =
    body.platform_fee_amount === undefined ? null : Number(body.platform_fee_amount);
  const requestedTotalFunding =
    body.total_funding_amount === undefined ? null : Number(body.total_funding_amount);
  const deadline = typeof body.deadline === "string" && body.deadline.trim() ? body.deadline.trim() : null;
  const projectId = typeof body.project_id === "string" && body.project_id.trim() ? body.project_id.trim() : null;

  if (!title) return { ok: false, field: "title", error: "title is required" };
  if (title.length < MIN_TITLE_LENGTH) {
    return { ok: false, field: "title", error: `title must be at least ${MIN_TITLE_LENGTH} characters` };
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return { ok: false, field: "title", error: `title must be at most ${MAX_TITLE_LENGTH} characters` };
  }

  if (!type) return { ok: false, field: "type", error: "type is required" };
  if (type.length < MIN_TYPE_LENGTH) {
    return { ok: false, field: "type", error: `type must be at least ${MIN_TYPE_LENGTH} characters` };
  }
  if (type.length > MAX_TYPE_LENGTH) {
    return { ok: false, field: "type", error: `type must be at most ${MAX_TYPE_LENGTH} characters` };
  }

  if (!description) return { ok: false, field: "description", error: "description is required" };
  if (description.length < MIN_DESCRIPTION_LENGTH) {
    return {
      ok: false,
      field: "description",
      error: `description must be at least ${MIN_DESCRIPTION_LENGTH} characters`,
    };
  }
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return {
      ok: false,
      field: "description",
      error: `description must be at most ${MAX_DESCRIPTION_LENGTH} characters`,
    };
  }

  if (!Number.isFinite(rewardAmount) || rewardAmount <= 0) {
    return { ok: false, field: "reward_amount", error: "reward_amount must be greater than 0" };
  }
  if (!/^\d+(\.\d{1,2})?$/.test(String(body.reward_amount))) {
    return { ok: false, field: "reward_amount", error: "reward_amount supports up to two decimal places" };
  }
  if (rewardAmount > MAX_REWARD_ADA) {
    return { ok: false, field: "reward_amount", error: `reward_amount cannot exceed ${MAX_REWARD_ADA} ADA` };
  }

  if (deadline && (!isValidDateOnly(deadline) || isPastDateOnly(deadline))) {
    return { ok: false, field: "deadline", error: "deadline must be a valid date that is not in the past" };
  }

  const { reward, platformFee, totalFunding } = getFundingBreakdown(rewardAmount);

  if (requestedPlatformFee !== null && roundAda(requestedPlatformFee) !== platformFee) {
    return { ok: false, field: "platform_fee_amount", error: "platform_fee_amount does not match reward_amount" };
  }

  if (requestedTotalFunding !== null && roundAda(requestedTotalFunding) !== totalFunding) {
    return { ok: false, field: "total_funding_amount", error: "total_funding_amount does not match reward_amount" };
  }

  return {
    ok: true,
    value: {
      title,
      description,
      type,
      reward_amount: reward,
      platform_fee_amount: platformFee,
      total_funding_amount: totalFunding,
      deadline,
      project_id: projectId,
    },
  };
}

export function validateEscrowPayload(
  body: unknown,
  expectedEscrowAddress: string | undefined,
): ValidationResult<{ escrow_tx_hash: string; escrow_address: string }> {
  if (!isPlainObject(body)) {
    return { ok: false, error: "Request body must be a JSON object." };
  }

  const escrowTxHash =
    typeof body.escrow_tx_hash === "string"
      ? body.escrow_tx_hash.trim()
      : typeof body.transaction_hash === "string"
        ? body.transaction_hash.trim()
        : "";
  const escrowAddress = typeof body.escrow_address === "string" ? body.escrow_address.trim() : "";

  if (!escrowTxHash) {
    return { ok: false, field: "escrow_tx_hash", error: "escrow_tx_hash is required" };
  }
  if (!TX_HASH_PATTERN.test(escrowTxHash)) {
    return { ok: false, field: "escrow_tx_hash", error: "escrow_tx_hash must be a 64 character hex transaction id" };
  }

  if (!escrowAddress) {
    return { ok: false, field: "escrow_address", error: "escrow_address is required" };
  }
  if (expectedEscrowAddress && escrowAddress !== expectedEscrowAddress) {
    return { ok: false, field: "escrow_address", error: "escrow_address does not match the configured escrow address" };
  }

  return { ok: true, value: { escrow_tx_hash: escrowTxHash, escrow_address: escrowAddress } };
}
