import { Cache, Database, InternalCom, Log as LegacyLog, Redis, RetroServices } from '@gamingfactory/rus';
import { Log } from '@gamingfactory/logging';
import { Actions } from '../Actions';
import { Conditions } from '../Conditions';
import { ConditionFactory } from '../conditions/ConditionFactory';
import { Events } from '../Events';
import { Rewards } from '../Rewards';
import { Rules } from '../Rules';
import { Triggers } from '../Triggers';
import { RewardTrigger } from '@gamingfactory/just-my-type';
import { RulesModel } from '../models/Rules';

const log: Log = new Log();
const legacyLog: LegacyLog = new LegacyLog();

let rules: Rules;
let events: Events;
let actions: Actions;
let rewards: Rewards;
let conditionFactory: ConditionFactory;
let conditions: Conditions;
let triggers: Triggers;

export const init = async () => {
  const db = await new Database(legacyLog);
  const redis = await new Redis();
  const cache = await new Cache();
  const coms = new InternalCom({ cache, initSQS: true, initSNS: false });
  const rulesModel = await new RulesModel(db, log);
  const retroService = new RetroServices();
  await retroService.init();
  rewards = new Rewards(db);
  conditionFactory = new ConditionFactory(db, rewards);
  conditions = new Conditions(db, conditionFactory);
  triggers = new Triggers(db);
  actions = new Actions(db, legacyLog, redis.client, retroService, coms);
  rules = new Rules(
    db,
    conditions,
    actions,
    triggers,
    conditionFactory,
    cache,
    legacyLog,
    rewards,
    retroService,
    rulesModel,
  );
  events = new Events(legacyLog, rules, conditions, actions, rewards, retroService, cache);
};

export const map = {
  triggeredEvent: async (args: RewardTrigger.Event) => await events.process(args),
};
