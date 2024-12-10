/** Display sorted ranking of most recent investors */

import { DataFrame } from "@sauber/dataframe";
import { Community, Investors } from "📚/repository/mod.ts";
import { DateFormat } from "📚/time/mod.ts";
import { Investor } from "📚/investor/mod.ts";
import { Assets } from "📚/assets/mod.ts";
import { Ranking } from "📚/ranking/mod.ts";

// Repo
if (!Deno.args[0]) throw new Error("Path missing");
const path: string = Deno.args[0];
if (!Deno.statSync(path)) throw new Error(`${path} does not exist.`);
const assets: Assets = Assets.disk(path);

// Load Model
const ranking: Ranking = assets.ranking;
if (!(await ranking.load())) ranking.generate();

// Load list of investors
console.log("Loading latest investors...");
const community: Community = assets.community;
const investors: Investors = await assets.community.latest();
const end: DateFormat | null = await community.end();
if (!end) throw new Error("No end date in community");
console.log(`${end} investor count:`, investors.length);

// Predict SharpeRatio for each Investor
const sr: number[] = investors.map((i: Investor) => ranking.predict(i, end));

const df = DataFrame.fromRecords(
  investors.map((investor: Investor, index: number) => ({
    Investor: investor.UserName,
    SharpeRatio: sr[index],
  })),
).sort("SharpeRatio");

const desired = df.select((r) => r.SharpeRatio as number > 0).reverse;
desired.slice(0, 5).digits(3).print(
  `Most Desired Investors of ${desired.length}`,
);
const undesired = df.select((r) => r.SharpeRatio as number < 0);
undesired.slice(0, 5).digits(3).print(
  `Most undesired Investors of ${undesired.length}`,
);
