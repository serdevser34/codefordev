import { CasinoProviders, RewardAction, UtilityJoiSchemas } from '@gamingfactory/just-my-type';
import { RetroServices } from '@gamingfactory/rus';
import joi from 'joi';
import { ActionRunResponse, ActionTypeClass } from '../../actions.types';
import { randomUUID } from 'crypto';
import { FreeSpinEvent } from '@gamingfactory/just-my-type/build/RewardHub/Trigger';
import { CurrencyAmount } from '@gamingfactory/just-my-type/build/RewardHub';
import dayjs from '../../utils/dayjs';

const FREE_SPIN_STAKES: number[] = [0.01, 0.02, 0.03, 0.04, 0.05, 0.1, 0.2, 0.5, 1];
const MIN_STAKE = 0;
const durationFormat = /(?:(?:P)|(?:\d+[YMWD]))+(?:T(?:\d+[HMS])+)?/;

// Model / Repo

// TODO tech debt, move to JMT
interface ExtendedFreeSpinsEvent extends Omit<FreeSpinEvent, 'gameList'> {
  gameList?: {
    id: number;
    name: string;
    stakes?: CurrencyAmount[];
  }[];
}

interface ExtendedFreeSpinOptions extends Omit<RewardAction.FreeSpinOptions, 'gameList'> {
  gameList?: {
    id: number;
    name: string;
    stakes?: CurrencyAmount[];
  }[];
}

type QuickfireCompiledPayload = {
  userId: number;
  numberOfSpins: number;
  providerId: number;
  expireDate: string | null;
  gameList?: {
    id: number;
    stakes?: CurrencyAmount[];
  }[];
  startDate: string;
  campaignId?: string;
};

type ExtendedSerializedPayloadType = RewardAction.SerializedPayloadType | QuickfireCompiledPayload;

const objectSchema = joi.object({
  id: UtilityJoiSchemas.dbId.optional(),
  name: joi.string().optional().allow(null),
});

const stakesSchema = joi.object({
  currency: joi.string().required(),
});

export class FreeSpinAction implements ActionTypeClass {
  private static readonly serviceName: string = 'casino';
  private static readonly command: string = 'casino:givefreespins';
  private readonly config: ExtendedFreeSpinOptions;

  constructor(private dbRow: RewardAction.FreeSpin, private retroServices: RetroServices) {
    this.config = this.dbRow.options;
  }

  /**
   * @description: Returns all the possible stake values
   * @return: stake values stored in db
   */
  public static getFreeSpinStakeMetas(): number[] {
    return FREE_SPIN_STAKES;
  }

  public static payloadValidation(providerId: CasinoProviders) {
    const sharedSchema = joi.object({
      provider: objectSchema.required(),
    });
    const listSchema = sharedSchema.keys({
      gameList: joi.array().items(objectSchema).required(),
    });
    switch (providerId) {
      case CasinoProviders.EVOLUTION:
        return listSchema.keys({
          expireTime: joi.string().regex(durationFormat).required(),
          stakes: joi
            .array()
            .items(
              stakesSchema.keys({
                amount: joi.number().integer().positive().required(),
                maxWinnings: joi.number().integer().min(1).required(),
              }),
            )
            .required(),
        });
      case CasinoProviders.PRAGMATIC:
        return listSchema.keys({
          numberOfSpins: joi.number().integer().min(1).required(),
          stakes: joi
            .array()
            .items(stakesSchema.keys({ amount: joi.number().min(MIN_STAKE).required() }))
            .required(),
          expireTime: joi.string().regex(durationFormat).required(),
        });
      case CasinoProviders.PLAYNGO:
        return sharedSchema.keys({
          numberOfSpins: joi.number().integer().min(1).required(),
          game: objectSchema.required(),
          stake: joi.number().min(MIN_STAKE).required(),
          campaignId: joi.number().integer().required(), // NOTE: Required for PlayNGo - should probably be made conditional using JOI .when() if another provider onboards and doesn't need this
        });
      case CasinoProviders.QUICKFIRE:
        return sharedSchema.keys({
          gameList: joi.array().items(
            objectSchema.keys({
              stakes: joi
                .array()
                .items(stakesSchema.keys({ amount: joi.number().min(MIN_STAKE).required() }))
                .required(),
            }),
          ),
          numberOfSpins: joi.number().integer().min(1).required(),
          expireTime: joi.string().regex(durationFormat).required(),
        });
      default:
        throw new Error('Game provider has no validation schema');
    }
  }

  /**
   * @description: Checks if the event received from other services exists and also if the config has its value set
   * @param event {Event}
   * @return: if config or event does not exist then we return null
   *          otherwise we return an object {FreeSpinCompiledPayload}
   */
  private compile(event: ExtendedFreeSpinsEvent): ExtendedSerializedPayloadType {
    if (!event || !event.info || !this.config) {
      return null;
    }

    const sharedParams = {
      userId: event.userId,
      providerId: this.config.provider.id,
    };

    if (this.config.provider.id === CasinoProviders.PRAGMATIC) {
      const durationInMilliseconds = dayjs.duration(this.config.expireTime).asMilliseconds();
      const expireDate = dayjs().utc().add(durationInMilliseconds).unix();
      const pragmaticCampaignId = randomUUID();
      const serializeGameId = this.config.gameList?.map((game: { id: number; name: string }) => game.id);
      // @ts-ignore update JMT FreeSpinPragmaticCompiledPayload interface, expireDate key to support number, merge post production release
      // https://github.com/gamingfactory/just-my-type/pull/346
      return {
        ...sharedParams,
        numberOfSpins: this.config.numberOfSpins,
        costPerSpin: this.config.stakes,
        gameList: serializeGameId, // kwiff's id for a casino providers
        expireDate,
        campaignId: pragmaticCampaignId, // The provider's campaign id
        startDate: event.date, //start date will be given when reward is received
      } as RewardAction.FreeSpinPragmaticCompiledPayload;
    }

    if (this.config.provider.id === CasinoProviders.EVOLUTION) {
      return {
        ...sharedParams,
        // @ts-ignore - not on type??
        maxWinnings: this.config.maxWinnings,
        campaignId: this.config.campaignId,
        stakes: this.config.stakes,
      } as RewardAction.FreeGameEvolutionCompiledPayload;
    }

    if (this.config.provider.id === CasinoProviders.QUICKFIRE) {
      const serializeGameId = this.config.gameList?.map(
        (game: { id: number; name: string; stakes?: CurrencyAmount[] }) => ({
          id: game.id,
          stakes: game?.stakes,
        }),
      );
      return {
        ...sharedParams,
        numberOfSpins: this.config.numberOfSpins,
        costPerSpin: this.config.stakes,
        gameList: serializeGameId, // kwiff's id for a casino providers with stakes
        expireDate: this.config.expireTime, // this is the endDate of the rule
        startDate: event.date, //start date will be given when reward is received
      } as QuickfireCompiledPayload;
    }

    return {
      ...sharedParams,
      numberOfSpins: this.config.numberOfSpins,
      costPerSpin: this.config.stake,
      gameId: this.config.game?.id, // This shouldn't be undefined at this point as it's taken care of in joi validation
      expireDate: event.info.endDate, // this is the endDate of the rule
      campaignId: this.config.campaignId, // The provider's campaign id
    } as RewardAction.FreeSpinCompiledPayload;
  }

  /**
   * @description: Gives free spins to a user and each spin has a specific amount
   * @param: event {Event}
   * @return: TRUE - if the user received with success their free spins
   *          FALSE - otherwise
   */
  public async run(event: FreeSpinEvent): Promise<ActionRunResponse | boolean> {
    const payload = this.compile(event);
    if (payload) {
      const { data: casinoResponse } = await this.retroServices.runCommand(
        FreeSpinAction.serviceName,
        FreeSpinAction.command,
        payload,
      );
      if (casinoResponse === true || casinoResponse.success) {
        return { rewardSourceId: payload.campaignId, actionType: 'FREE_SPIN' };
      }
    }
    return false;
  }

  public static getOptionData(action: RewardAction.FreeSpin): { stake: number } {
    return {
      stake: action.options.stake || 0,
    };
  }
}
