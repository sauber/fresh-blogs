import { RepoDiskBackend } from "./repo-disk.ts";
import { FetchRateLimitingBackend } from "./fetch-ratelimit.ts";
import { Refresh } from "./refresh.ts";
import { InvestorId, DiscoverParams } from "./repo.d.ts";
import { Config } from "./config.ts";
import { Repo } from "./repo.ts";

const path = Deno.args[0];
const backend = new RepoDiskBackend(path);
const repo = new Repo(backend);

const config: Config = repo.config;

const UserName = await config.get("UserName") as string;
const CustomerId = await config.get("CustomerId") as number;
const investorId: InvestorId = { UserName, CustomerId };

const risk = await config.get("discover_risk") as number;
const daily = await config.get("discover_daily") as number;
const weekly = await config.get("discover_daily") as number;
const discoverOptions: DiscoverParams = { risk, daily, weekly };

const rate = await config.get("delay") as number;
const fetcher: FetchRateLimitingBackend = new FetchRateLimitingBackend(rate);

const refresh = new Refresh(backend, fetcher, investorId, discoverOptions);

const count: number = await refresh.run();
console.log(`Assets downloaded: ${count}`);
