export type AgentKVValue = Record<string, unknown> | string | number | boolean | null;

export interface AgentKVPayload {
  key: string;
  value: AgentKVValue;
  agent: string;
  cycle: string;
  intent?: string;
  previousHash?: string | null;
  signature: string;
}

export interface OaaMemoryEntry {
  ts: number;
  note: string;
  tag: string;
  agent: string;
  cycle: string;
  intent?: string;
  data: {
    key: string;
    value: AgentKVValue;
  };
  hash: string;
  previous_hash: string | null;
  type: "OAA_MEMORY_ENTRY_V1";
}
