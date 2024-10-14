import { RewardAction, RewardCondition, RewardTrigger, UserStatus } from '@gamingfactory/just-my-type';
import { Log, RetroServices } from '@gamingfactory/rus';
import { Actions } from '../Actions';
import { Rewards } from '../Rewards';
import { Rules } from '../Rules';
import dayjs from 'dayjs';
import { ArtificialEventArgs, InstantArgs, IssueRewardResponse } from './reward-hub.types';
import { randomUUID } from 'crypto';

export class Instant {
  constructor(
    private log: Log,
    private retroServices: RetroServices,
    private actions: Actions,
    private rewards: Rewards,
    private rules: Rules,
  ) {}

  public async issueAction(args: InstantArgs): Promise<IssueRewardResponse> {
    const { userIds, actions, ruleId } = args;

    const createResponse = ruleId ? { ruleId } : await this.createRule(actions);

    await Promise.all(
      userIds.map(async userId => {
        await this.runActions(actions, userId, createResponse.ruleId);

        await this.rewards.save(userId, createResponse.ruleId).catch((error: Error) => {
          this.log.error({
            message: `Was not able to issue rewardID ${args.ruleId} to userID ${userId}`,
            userId: userId,
            stack: error.stack || '',
          });
          throw error;
        });
      }),
    );

    return { success: true };
  }

  private createRule(actions: RewardAction.Action[]) {
    return this.rules.create({
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      actions: actions,
      conditions: [
        {
          type: RewardCondition.Type.USER_STATUS,
          options: {
            values: [UserStatus.ACTIVE],
          },
        },
        {
          type: RewardCondition.Type.EXCLUDE_PRODUCT_BLOCK,
          options: {
            product: null,
          },
        },
      ],
      triggers: [{ type: RewardTrigger.Type.INSTANT }],
      name: `Instant Reward ${randomUUID()}`,
    });
  }

  private async runActions(actions: RewardAction.Action[], userId: number, ruleId: number) {
    return actions.map(async action => {
      const [runnableAction, artificialEvent] = await Promise.all([
        this.actions.getActionTypeClass({ ...action, ruleID: ruleId }),
        this.compileEventPayload({ userId, action }),
      ]);
      return runnableAction.run(artificialEvent).catch((error: Error) => {
        this.log.error({
          message: `[reward-hub][Instant][issueReward] Failed to issue reward to user`,
          userId,
          stack: error.stack || '',
        });
        throw error;
      });
    });
  }

  private async compileEventPayload(args: ArtificialEventArgs): Promise<RewardTrigger.Event> {
    const { data: user } = await this.retroServices.runCommand('user', 'user:get', { userId: args.userId });
    const date = dayjs();

    const sharedParams = {
      ...user,
      userId: args.userId,
      userStatus: user.user.status,
      type: RewardTrigger.Type.INSTANT,
      date: new Date().toISOString(),
    };

    const freeSpinsInfo = {
      info: {
        endDate: date.add(1, 'd').toISOString(),
      },
    };

    switch (args.action.type) {
      case RewardAction.Type.SURPRISE_BET_V2:
        return sharedParams;
      case RewardAction.Type.SURPRISE_BET:
        return sharedParams;
      case RewardAction.Type.FREE_SPIN:
        return {
          ...sharedParams,
          ...freeSpinsInfo,
        };
      case RewardAction.Type.CASH_REWARD_V2:
        return sharedParams;
      case RewardAction.Type.CASH_REWARD:
        return sharedParams;
      case RewardAction.Type.IN_APP_MESSAGE:
        return sharedParams;
      default:
        throw Error(
          `[compileActionPayload]Unknown ActionType Passed To Reward-Hub Instant Action Compiler: ${args.action.type}`,
        );
    }
  }
}
