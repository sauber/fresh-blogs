import { AssetNames, Backend } from "📚/storage/mod.ts";
import { DateFormat, diffDate, nextDate } from "📚/time/mod.ts";
import { Investor } from "📚/investor/mod.ts";
import { Bar, Chart } from "@sauber/backtest";
import { InvestorAssembly } from "📚/repository/investor-assembly.ts";
import { Config } from "📚/config/config.ts";
import { Mirror } from "📚/repository/mod.ts";
import shuffleArray from "@hugoalh/shuffle-array";
import { today } from "📚/time/calendar.ts";

export type Names = Array<string>;
export type Investors = Array<Investor>;
type Dates = Array<DateFormat>;

/** Handle Community I/O requests to local repository */
export class Community {
  private readonly config: Config;
  constructor(private readonly repo: Backend) {
    this.config = new Config(repo);
  }

  /** Name of owner */
  private async owner(): Promise<string> {
    const investor = await this.config.get("account") as Mirror;
    if (investor) return investor.UserName;
    return "";
  }

  /** List of all dates in repo */
  private dates(): Promise<Dates> {
    return this.repo.dirs();
  }

  /** Identify all investor names on a date */
  public async namesByDate(date: DateFormat): Promise<Names> {
    const assets: AssetNames = await (await this.repo.sub(date)).names();
    const valid = /(chart|portfolio|stats)$/;

    // Catalog which file type exist for each investor name
    const names = new Set<string>();
    assets.values()
      .filter((assetname: string) => assetname.match(valid) != null)
      .forEach((assetname: string) => {
        const [name, _type] = assetname.split(".");
        names.add(name);
      });
    // Don't include portfolio owner
    const owner: string = await this.owner();
    names.delete(owner);
    return Array.from(names);
  }

  /** Unique set of names across all dates */
  public async allNames(): Promise<Names> {
    const dates: Dates = await this.dates();
    const allNames: Names[] = await Promise.all(
      dates.map((date) => this.namesByDate(date)),
    );
    const merged = new Set(allNames.flat());
    return Array.from(merged);
  }

  /** A set of investor names */
  public async samples(count: number): Promise<Names> {
    const all: Names = await this.allNames();
    const some: Names = shuffleArray(all).slice(0, count);
    return some;
  }

  /** The first directory where names exists */
  public async start(): Promise<DateFormat | null> {
    const dates: Dates = await this.dates();
    for (const date of [...dates]) {
      if ((await this.namesByDate(date)).length) return date;
    }
    return null;
  }

  /** The last directory where names exists */
  public async end(): Promise<DateFormat | null> {
    const dates: Dates = await this.dates();
    for (const date of [...dates].reverse()) {
      if ((await this.namesByDate(date)).length) return date;
    }
    return null;
  }

  /** Test if investor is active at bar */
  private async activeName(
    username: string,
    date: DateFormat,
  ): Promise<boolean> {
    const investor = await this.investor(username);
    const bar: Bar = diffDate(date, today());
    return investor.isActive(bar);
  }

  /** Names of investors where date is within active range */
  public async active(date: DateFormat): Promise<Names> {
    const allNames: Names = await this.allNames();
    const validVector: Array<boolean> = await Promise.all(
      allNames.map((name) => this.activeName(name, date)),
    );
    const validNames: string[] = allNames.filter(
      (_name, index) => validVector[index],
    );
    const names: Names = Array.from(validNames);
    return names;
  }

  private _loaded: Record<string, Investor> = {};
  /** Create and cache Investor object */
  public async investor(username: string): Promise<Investor> {
    if (!(username in this._loaded)) {
      const assembly = new InvestorAssembly(username, this.repo);
      this._loaded[username] = await assembly.investor();
    }
    return this._loaded[username];
  }

  /** Get one random investor */
  public async any(): Promise<Investor> {
    const names: Names = await this.allNames();
    const count: number = names.length;
    const index: number = Math.floor(Math.random() * count);
    const name: string = names[index];
    return this.investor(name);
  }

  /** Load a list of investors from list of names */
  private load(names: Names): Promise<Investors> {
    return Promise.all(names.map((name) => this.investor(name)));
  }

  /** All investor */
  public async all(): Promise<Investors> {
    const names: Names = await this.allNames();
    return this.load(names);
  }

  /** Investors on latest date */
  public async latest(): Promise<Investors> {
    const end: DateFormat | null = await this.end();
    if (!end) return [];
    // Charts are two days old
    const chartend: DateFormat = nextDate(end, -2);
    const names: Names = await this.namesByDate(chartend);
    return this.load(names);
  }

  /** Load a list of investor charts from list of names */
  private loadCharts(names: Names): Promise<Array<Chart>> {
    return Promise.all(
      names.map((name) => this.investor(name).then((i) => i.chart)),
    );
  }

  /** Charts for all investors */
  public async allCharts(): Promise<Array<Chart>> {
    const names: Names = await this.allNames();
    return this.loadCharts(names);
  }
}
