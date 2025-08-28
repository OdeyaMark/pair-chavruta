export enum PairStatus {
  Default = 0,
  Standby = 1,
  Active = 2,
  Learning = 3
}

// Convert numbers to string labels
export const PairStatusLabels: Record<PairStatus, string> = {
  [PairStatus.Default]: 'Default',
  [PairStatus.Standby]: 'Standby',
  [PairStatus.Active]: 'Active',
  [PairStatus.Learning]: 'Learning'
};