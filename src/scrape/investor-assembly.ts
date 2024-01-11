import type { DateFormat } from "📚/utils/time/mod.ts";
import { diffDate, nextDate } from "📚/utils/time/calendar.ts";
import { Asset, Backend } from "/repository/mod.ts";
import { Investor } from "📚/investor/mod.ts";
import { Chart } from "📚/chart/mod.ts";
import { InvestorId } from "📚/scrape/mod.ts";

import type { ChartData } from "./chart.ts";
import { Chart } from "./chart.ts";

import type { PortfolioData } from "./portfolio.ts";
import { Portfolio } from "./portfolio.ts";
export type MirrorsByDate = Record<DateFormat, InvestorId[]>;

import type { StatsData, StatsExport } from "./stats.ts";
import { Stats } from "./stats.ts";
export type StatsByDate = Record<DateFormat, StatsExport>;

/** Extract scraped data and compile an investor object */
export class InvestorAssembly {
  private readonly chartAsset: Asset<ChartData>;
  private readonly portfolioAsset: Asset<PortfolioData>;
  private readonly statsAsset: Asset<StatsData>;

  constructor(public readonly UserName: string, readonly repo: Backend) {
    this.chartAsset = new Asset<ChartData>(this.UserName + ".chart", repo);
    this.portfolioAsset = new Asset<PortfolioData>(
      this.UserName + ".portfolio",
      repo
    );
    this.statsAsset = new Asset<StatsData>(this.UserName + ".stats", repo);
  }

  /** Customer ID */
  public async CustomerId(): Promise<number> {
    const stats: StatsData = await this.statsAsset.last();
    const id: number = stats.Data.CustomerId;
    return id;
  }

  /** Customer ID */
  public async FullName(): Promise<string | undefined> {
    const stats: StatsData = await this.statsAsset.last();
    return stats.Data.FullName;
  }

  /** First date of combined charts */
  public async start(): Promise<DateFormat> {
    const chart: number[] = await this.chart();
    const end: DateFormat = await this.end();
    const days: number = chart.length;
    const start: DateFormat = nextDate(end, -days + 1);
    return start;
  }

  /** Last date where chart is present */
  public end(): Promise<DateFormat> {
    return this.chartAsset.end();
  }

  /** Combination of as few charts as possible from start to end */
  private _chart: number[] | null = null;
  public async chart(): Promise<number[]> {
    if (this._chart) return this._chart;

    // All dates having a chart
    const dates: DateFormat[] = await this.chartAsset.dates();

    // Load latest chart
    const end: DateFormat = dates[dates.length - 1];
    const lastData: ChartData = await this.chartAsset.retrieve(end);
    const lastChart = new Chart(lastData);
    const values: number[] = lastChart.values;
    let start: DateFormat = lastChart.start;

    // Prepend older charts
    // Search backwards to find oldest chart which still overlaps
    for (let i = dates.length - 2; i >= 0; i--) {
      const date = dates[i];
      if (date < start) break; // Too old to overlap
      if (i > 0 && dates[i - 1] >= start) continue; // An even older exists and overlaps

      // Load older chart
      const sooner: Chart = new Chart(await this.chartAsset.retrieve(date));

      // Does newer chart fully overlap older?
      if (sooner.start >= start) break;

      // How many days from sooner to prepend
      const days: number = diffDate(sooner.start, start);

      // Amount to scale values from sooner
      const scale: number = values[0] / sooner.values[days];

      // Array to be prepended
      const prepend: number[] = sooner.values
        .slice(0, days)
        .map((value) => value * scale);
      //console.log({date, days, scale, prepend});
      values.splice(0, 0, ...prepend);

      // New start
      start = sooner.start;
    }

    // Truncate floating digits to 2
    const price = values.map((v) => +v.toFixed(2));
    // Caching
    this._chart = price;
    return price;
  }

  /** Extract essential data from stats on date */
  private async statsValues(date: DateFormat): Promise<StatsExport> {
    const loaded: StatsData = await this.statsAsset.retrieve(date);
    const stats = new Stats(loaded);
    return stats.value;
  }

  /** Extract stats for all available dates within chart range */
  public async stats(): Promise<StatsByDate> {
    // Dates
    const start: DateFormat = await this.start();
    const end: DateFormat = await this.end();
    const dates: DateFormat[] = await this.statsAsset.dates();
    const range: DateFormat[] = dates.filter(
      (date) => date >= start && date <= end
    );

    // Load Stats axports for eachd date in range
    const values: StatsExport[] = await Promise.all(
      range.map((date) => this.statsValues(date))
    );

    // Zip Dates and Stats
    const zip: StatsByDate = Object.assign(
      {},
      ...range.map((date, index) => ({ [date]: values[index] }))
    );
    return zip;
  }

  /** Extract list of investors from portfolio */
  private async portfolioValues(date: DateFormat): Promise<InvestorId[]> {
    const loaded: PortfolioData = await this.portfolioAsset.retrieve(date);
    const portfolio = new Portfolio(loaded);
    return portfolio.investors;
  }

  /** Latest mirrors */
  public async mirrors(): Promise<MirrorsByDate> {
    // Dates
    const start: DateFormat = await this.start();
    const end: DateFormat = await this.end();
    const dates: DateFormat[] = await this.portfolioAsset.dates();
    const range: DateFormat[] = dates.filter(
      (date) => date >= start && date <= end
    );

    // Load Stats axports for eachd date in range
    const values: InvestorId[][] = await Promise.all(
      range.map((date) => this.portfolioValues(date))
    );

    // Zip Dates and Stats
    const zip: MirrorsByDate = Object.assign(
      {},
      ...range.map((date, index) => ({ [date]: values[index] }))
    );
    return zip;
  }

  /** Generate investor object */
  public async investor(): Promise<Investor> {
    return new Investor(
      this.UserName,
      await this.CustomerId(),
      await this.FullName(),
      new Chart(await this.chart(), await this.end())
    );
  }
}
