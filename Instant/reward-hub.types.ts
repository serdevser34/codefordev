import { RewardAction } from '@gamingfactory/just-my-type';

export interface InstantArgs {
  ruleId?: number;
  userIds: number[];
  actions: RewardAction.Action[];
}

export interface ArtificialEventArgs {
  userId: number;
  action: RewardAction.Action;
}

export interface IssueRewardResponse {
  success: true;
}
