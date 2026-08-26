import { SyncEntityRecord } from "./types";

export interface ConflictResolutionResult {
  winner: "local" | "remote";
  resolvedRecord: SyncEntityRecord;
  reason: string;
}

/**
 * Resolves conflicts between local and remote versions of an entity.
 * Invariant (Problem 1 Fix): Conflict resolution relies on server-assigned ingestion sequence / timestamp (serverSeq / serverUpdatedAt),
 * NEVER on raw client-device timestamps (clientUpdatedAt) which drift or can be user-manipulated.
 */
export function resolveConflict(
  local: SyncEntityRecord,
  remote: SyncEntityRecord
): ConflictResolutionResult {
  // Rule 1: Higher serverSeq wins unconditionally (monotonically increasing version from server)
  const localSeq = local.serverSeq ?? 0;
  const remoteSeq = remote.serverSeq ?? 0;

  if (remoteSeq > localSeq) {
    return {
      winner: "remote",
      resolvedRecord: remote,
      reason: `Remote server sequence (${remoteSeq}) is greater than local (${localSeq})`,
    };
  }

  if (localSeq > remoteSeq) {
    return {
      winner: "local",
      resolvedRecord: local,
      reason: `Local server sequence (${localSeq}) is greater than remote (${remoteSeq})`,
    };
  }

  // Rule 2: If server sequence is equal, compare server ingestion timestamps
  const localServerTime = local.serverUpdatedAt ?? 0;
  const remoteServerTime = remote.serverUpdatedAt ?? 0;

  if (remoteServerTime > localServerTime) {
    return {
      winner: "remote",
      resolvedRecord: remote,
      reason: `Remote server timestamp (${remoteServerTime}) is newer than local (${localServerTime})`,
    };
  }

  if (localServerTime > remoteServerTime) {
    return {
      winner: "local",
      resolvedRecord: local,
      reason: `Local server timestamp (${localServerTime}) is newer than remote (${remoteServerTime})`,
    };
  }

  // Rule 3: Tombstone precedence (deletedAt) — deletion wins if sequences and timestamps match
  const localIsDeleted = local.deletedAt !== null && local.deletedAt !== undefined;
  const remoteIsDeleted = remote.deletedAt !== null && remote.deletedAt !== undefined;

  if (remoteIsDeleted && !localIsDeleted) {
    return {
      winner: "remote",
      resolvedRecord: remote,
      reason: "Remote deletion tombstone takes precedence",
    };
  }

  if (localIsDeleted && !remoteIsDeleted) {
    return {
      winner: "local",
      resolvedRecord: local,
      reason: "Local deletion tombstone takes precedence",
    };
  }

  // Rule 4: Deterministic tie-breaking (lexicographic comparison of JSON data)
  const localPayload = JSON.stringify(local.data);
  const remotePayload = JSON.stringify(remote.data);

  if (remotePayload >= localPayload) {
    return {
      winner: "remote",
      resolvedRecord: remote,
      reason: "Deterministic tie-break favored remote",
    };
  }

  return {
    winner: "local",
    resolvedRecord: local,
    reason: "Deterministic tie-break favored local",
  };
}
