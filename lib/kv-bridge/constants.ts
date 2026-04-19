/** Terminal KV keys allowed through the warm bridge (write allowlist). */
export const KV_BRIDGE_ALLOWED_KEYS = new Set([
  "GI_STATE",
  "GI_STATE_CARRY",
  "SIGNAL_SNAPSHOT",
  "HEARTBEAT",
  "SYSTEM_PULSE",
  "LAST_INGEST",
  "ECHO_STATE",
  "CURRENT_CYCLE",
  "MIC_READINESS_SNAPSHOT",
  "VAULT_STATE",
  "VAULT_GLOBAL_META",
  "TRIPWIRE_STATE",
  "TRIPWIRE_STATE_KV"
]);
