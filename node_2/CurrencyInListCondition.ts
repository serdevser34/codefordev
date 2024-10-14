import { CoreUserObj, RewardTrigger } from '@gamingfactory/just-my-type';
import joi from 'joi';
import { ConditionData, ConditionTypeClass } from '../../Conditions';
import { Log } from '@gamingfactory/rus';

const log = new Log();

export class CurrencyInListCondition implements ConditionTypeClass {
  private readonly currenciesList: string[];

  constructor(options: { values: string[] }) {
    if (!options.values || !options.values.length) {
      throw new Error('[CurrencyInListCondition] Missed currency Code in Condition - No Value');
    }
    this.currenciesList = options.values;
  }

  public static validationSchema = joi.object({
    values: joi.array().items(joi.string()),
  });

  public async evaluate(event: RewardTrigger.Event): Promise<boolean> {
    const user = event.user;

    if (!user) {
      return false;
    }

    return this.currencyCheck(user);
  }

  public async evaluateOptIn(conditionData: ConditionData): Promise<boolean> {
    return this.currencyCheck(conditionData.user);
  }

  private async currencyCheck(user: CoreUserObj): Promise<boolean> {
    if (!user.currency.isoAlphabeticCode) {
      log.warn({ userId: user.id, message: '[CurrencyInListCondition][evaluate] user currency not exist' });
      return false;
    }

    if (this.currenciesList.includes(user.currency.isoAlphabeticCode)) {
      log.debug({ message: `[CurrencyInListCondition][evaluate] evaluation result: true`, userId: user.id });
      return true;
    }

    log.debug({
      message: `[CurrencyInListCondition][evaluate] evaluation result: false`,
      userId: user.id,
      data: {
        conditionCurrenciesTerms: this.currenciesList,
        userCurrency: user.currency.isoAlphabeticCode,
      },
    });
    return false;
  }
}
