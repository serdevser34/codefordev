import { AxiosResponse } from 'axios';
import { RewardAction, RewardTrigger, UtilityJoiSchemas, CoreUserObj } from '@gamingfactory/just-my-type';
import { ReceiverTypes, CurrencyAmount } from '@gamingfactory/just-my-type/build/RewardHub';
import { InternalCom, RetroServices, Log } from '@gamingfactory/rus';
import joi from 'joi';
import { ActionRunResponse, ActionTypeClass } from '../../actions.types';
import { currencyAmountSchema } from '../../schemas';

const surpriseBetParamsValidation = joi.object({
  id: UtilityJoiSchemas.dbId,
  name: joi.string().optional().allow(null),
});

export class SurpriseBetActionV2 implements ActionTypeClass {
  private readonly config: {
    value: number;
    stakes: CurrencyAmount[];
    sportId: number;
    receiver?: ReceiverTypes.REFERRER; // Optional key to denote that the surprise bet should be awarded to the referrer of the user
  };

  constructor(
    private dbRow: RewardAction.SurpriseBetV2,
    private coms: InternalCom,
    private log: Log,
    private retroServices: RetroServices,
  ) {
    const info = this.dbRow.options;

    this.config = {
      value: 0,
      stakes: info.values.stakes,
      sportId: info.values.sport.id,
      receiver: info.values.receiver,
    };

    switch (info.values.surpriseBetType) {
      case RewardAction.SurpriseBetType.BET_SPORT: {
        this.config.value = info.values.sport.id;
        break;
      }
      case RewardAction.SurpriseBetType.BET_COMPETITION: {
        this.config.value = info.values.competition.id;
        break;
      }
      case RewardAction.SurpriseBetType.BET_EVENT: {
        this.config.value = info.values.event.id;
        break;
      }
    }
  }

  public static validationSchema = joi.object({
    values: joi
      .object({
        surpriseBetType: joi.string().required().only(Object.values(RewardAction.SurpriseBetType)),
        stakes: joi.array().items(currencyAmountSchema).required().min(0),
        sport: surpriseBetParamsValidation.optional(),
        competition: surpriseBetParamsValidation.optional(),
        event: surpriseBetParamsValidation.optional(),
        receiver: joi.string().valid([ReceiverTypes.REFERRER]).optional(),
      })
      .required(),
  });

  public async run(event: RewardTrigger.Event): Promise<ActionRunResponse | false> {
    if (!event.user) {
      this.log.error({
        message: `Failed to create a surprise bet. user not found on event`,
        userId: event.userId,
        stack: '',
      });

      return false;
    }
    const user = await this.getUserToReward(event.user);

    const userCurrency = user.currency.isoAlphabeticCode;
    const userCurrencyStake = this.config.stakes.find(stake => stake.currency === userCurrency);

    if (!userCurrencyStake) {
      this.log.error({
        message: 'Failed to create a surprise bet. stake not found for user currency',
        userId: event.userId,
        stack: '',
      });

      return false;
    }

    return this.createSurpriseBet(user.id, userCurrencyStake.amount);
  }

  private async getUserToReward(user: CoreUserObj): Promise<CoreUserObj> {
    const userId = user.id;

    if (this.config.receiver !== ReceiverTypes.REFERRER) {
      return user;
    }

    const referralInfoResponse = (await this.retroServices
      .runCommand('user', 'user:referralinfo', { userId })
      .catch(e => {
        this.log.error({
          message: `[Reward][surprisBetAction][referrerUser][user:referralinfo]`,
          userId,
          stack: e.stack,
        });

        throw new Error('Failed to get user referral info');
      })) as {
      data: { referrer: number };
    };

    return this.getUserReferrer(referralInfoResponse.data.referrer);
  }

  private async getUserReferrer(userId: number): Promise<CoreUserObj> {
    const userResponse = (await this.retroServices
      .runCommandAsync('user', 'user:get', { userId }, { useCache: true })
      .catch(e => {
        this.log.error({ message: `[Reward][surprisBetAction][referrerUser][user:get]`, userId, stack: e.stack });

        throw new Error(`Failed to get referrer user: ${JSON.stringify(e)}`);
      })) as AxiosResponse<{ user: CoreUserObj }>;

    return userResponse.data.user;
  }

  private async createSurpriseBet(userId: number, stake: number): Promise<ActionRunResponse | false> {
    try {
      const surpriseBetCollection = await this.coms.reqrep('ticket', 'createSurpriseBet', {
        userId,
        sportId: this.config.sportId,
        competitionId:
          this.dbRow.options.values.surpriseBetType === RewardAction.SurpriseBetType.BET_COMPETITION
            ? this.config.value
            : undefined,
        eventId: undefined,
        offerTypeId: undefined,
        stake,
      });

      if (!surpriseBetCollection) {
        this.log.error({ message: 'Failed to create a surprise be. Ticket not created', userId, stack: '' });

        return false;
      }

      this.log.info({
        message: `[reward-hub][SurpriseBetAction] Successfully created surprise bet with type : 'SURPRISE_BET_V2', collection ID :\n ${surpriseBetCollection.id}`,
        userId,
        surpriseBetCollection,
      });
      return { collectionObj: surpriseBetCollection, actionType: RewardAction.Type.SURPRISE_BET_V2 };
    } catch (e) {
      this.log.error({
        message: `Failed to create a surprise bet`,
        userId,
        stack: e instanceof Error ? e.stack || '' : '',
      });
      return false;
    }
  }
}
