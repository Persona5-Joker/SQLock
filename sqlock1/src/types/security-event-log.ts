export type SecurityEventLog = {
  id: number;
  ts_utc: Date;
  decision: string;
  suspicion_score: number;
  query_template: string | null;
};
