export interface KvBridgeEntry {
  value: unknown;
  written_at: string;
  source?: string;
  ttl_seconds?: number;
}

export type KvBridgeStore = Record<string, KvBridgeEntry>;
