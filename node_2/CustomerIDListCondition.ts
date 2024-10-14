import { RewardTrigger } from '@gamingfactory/just-my-type';
import joi from 'joi';
import { ConditionTypeClass } from '../../Conditions';

export class CustomerIDListCondition implements ConditionTypeClass {
  private userIdList: number[];

  constructor(options: { values: number[]; filename: string }) {
    if (!options.values) {
      throw new Error('Invalid CustomerIDList Condition - No Values');
    }
    this.userIdList = options.values;
  }

  public static validationSchema = joi.object({
    filename: joi
      .string()
      .required()
      .regex(/.+\.csv$/),
    values: joi.array().required().items(joi.number().required()),
  });

  public async evaluate(event: RewardTrigger.Event): Promise<boolean> {
    // Check the data from the list in the database
    const userIdExists = this.userIdList.includes(event.userId);

    // Return present
    return userIdExists;
  }

  public getOptionData(): { userCount: number } {
    return {
      userCount: this.userIdList.length,
    };
  }
}
