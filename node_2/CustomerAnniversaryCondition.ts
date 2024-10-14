import { RewardTrigger } from '@gamingfactory/just-my-type';
import joi from 'joi';
import dayjs from 'dayjs';
import { ConditionTypeClass } from '../../Conditions';
import { ConditionOptions } from '../types';
import { Database } from '@gamingfactory/rus';

export enum AcceptedDateConditions {
  BIRTHDAY = 'BIRTHDAY',
  ACCOUNT_CREATION_DATE = 'ACCOUNT_CREATION_DATE',
  FIRST_DEPOSIT_DATE = 'FIRST_DEPOSIT_DATE',
}

export class CustomerAnniversaryCondition implements ConditionTypeClass {
  private readonly conditions: string[];

  constructor(config: ConditionOptions, private ruleID: number, private db: Database) {
    this.conditions = config.values;
  }

  public static validationSchema = joi.object({
    values: joi
      .array()
      .required()
      .length(1)
      .items(joi.string().valid(...Object.values(AcceptedDateConditions))),
  });

  public async evaluate(event: RewardTrigger.Event): Promise<boolean> {
    const [latestReward] = await this.db
      .primary('rewards')
      .select()
      .where({
        ruleID: this.ruleID,
        userID: event.userId,
      })
      .orderBy('createdAt', 'desc')
      .limit(1);

    // if another reward was given this year evaluation fails
    if (latestReward && dayjs(latestReward.createdAt).get('year') === dayjs().get('year')) {
      return false;
    }

    const [condition] = this.conditions;
    switch (condition) {
      case AcceptedDateConditions.BIRTHDAY:
        const userBirthday = event.user?.dateOfBirth;
        return userBirthday ? this.checkAnniversary(userBirthday) : false;
      case AcceptedDateConditions.ACCOUNT_CREATION_DATE:
        const accountCreationDate = event.user?.createdAt;
        return accountCreationDate ? this.checkAnniversary(accountCreationDate) : false;
      case AcceptedDateConditions.FIRST_DEPOSIT_DATE:
        const firstDepositDate = event.user?.firstDepositAt;
        return firstDepositDate ? this.checkAnniversary(firstDepositDate) : false;
      default:
        return false;
    }
  }

  private checkAnniversary(date: string): boolean {
    const currentDate = dayjs();
    const anniversaryDate = dayjs(date);

    return currentDate.format('MM-DD') === anniversaryDate.format('MM-DD') && currentDate.get('year') > anniversaryDate.get('year');
  }
}
