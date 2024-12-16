import {
  Positions,
  PurchaseOrders,
  Strategy,
  StrategyContext,
} from "@sauber/backtest";
import { nextDate, today } from "📚/time/calendar.ts";
import { DateFormat, weekdayFromDate } from "📚/time/mod.ts";
import {
  RSIStrategy,
  SizingStrategy,
  WeekdayStrategy,
} from "📚/strategy/mod.ts";

export type Parameters = {
  weekday: number;
};

/**
 * Combination of several strategies:
 * - Timing - Is this correct time to trade
 * - Fundamental - Screening and ranking of investors
 * - Technical - Identify opportunities
 * - Portfolio - Count and sizing of positions
 * - others...?
 */
export class TradingStrategy implements Strategy {
  private readonly timing: Strategy;
  public readonly weekday: number = 1;

  private readonly technical: Strategy;
  public readonly window: number = 21;
  public readonly buy: number = 30;
  public readonly sell: number = 70;

  private readonly sizing: Strategy;

  constructor(params: Partial<TradingStrategy> = {}) {
    Object.assign(this, params);
    this.timing = new WeekdayStrategy(this.weekday);
    this.technical = new RSIStrategy(this.window, this.buy, this.sell);
    this.sizing = new SizingStrategy();
  }

  /** Print out conect of Context */
  private printContext(strategy: Strategy, context: StrategyContext): void {
    const date: DateFormat = nextDate(today(), -context.bar);
    console.log(strategy.constructor.name);
    console.log("  Bar:", context.bar, "Date:", weekdayFromDate(date), date);
    console.log("  Value:", context.value, "Amount:", context.amount);
    console.log("  Positions:", context.positions.length);
    console.log("  POs:", context.purchaseorders.length);
  }

  public close(context: StrategyContext): Positions {
    // console.log("Closing strategies");
    // this.printContext(this, context);
    const strategies: Array<Strategy> = [this.timing, this.technical];

    let positions: Positions = [];
    for (const strategy of strategies) {
      positions = strategy.close(context);
      Object.assign(context, { positions });
      // this.printContext(strategy, context);
      if (positions.length < 1) return [];
    }
    return positions;
  }

  public open(context: StrategyContext): PurchaseOrders {
    // console.log("Opening strategies");
    // this.printContext(this, context);
    const strategies: Array<Strategy> = [
      this.timing,
      this.technical,
      this.sizing,
    ];

    let purchaseorders: PurchaseOrders = [];
    for (const strategy of strategies) {
      purchaseorders = strategy.open(context);
      Object.assign(context, { purchaseorders });
      // this.printContext(strategy, context);
      if (purchaseorders.length < 1) return [];
    }
    return purchaseorders;
  }
}
