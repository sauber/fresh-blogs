import { Backend } from "../storage/mod.ts";
import { Model } from "./model.ts";
import { Features } from "./features.ts";
import type { Input, Output } from "./features.ts";
import { DataFrame } from "/utils/dataframe.ts";
import { TextSeries } from "/utils/series.ts";
import { Investor } from "📚/investor/mod.ts";

type Investors = Array<Investor>;

type Feature = Record<string, number | boolean>;

function normalize(name: string, numbers: Feature): Feature {
  Object.entries(numbers).forEach(([key, value]) => {
    if (typeof value === "boolean") numbers[key] = value === true ? 1 : 0;
    else if (Number.isFinite(value) === false) {
      console.log({name, numbers});
      throw new Error(`Invalid number ${name} ${key} ${value}`);
    }
  });
  return numbers;
}

export class Ranking {
  private readonly model: Model;

  constructor(repo: Backend) {
    this.model = new Model(repo);
  }

  /** Input features for investors */
  private input(investors: Investors): DataFrame {
    const list: Array<Input> = investors.map((i: Investor) =>
      normalize(i.UserName, new Features(i).input)
    );
    return DataFrame.fromRecords(list);
  }

  /** Output features for investors */
  private output(investors: Investors): DataFrame {
    const list: Array<Output> = investors.map((i: Investor) =>
      normalize(i.UserName, new Features(i).output)
    );
    return DataFrame.fromRecords(list);
  }

  /** Train model with extracted features */
  public train(investors: Investors): Promise<void> {
    const train_x = this.input(investors);
    const train_y = this.output(investors);

    return this.model.train(train_x, train_y);
  }

  /** Save model to repo */
  public save(): Promise<void> {
    return this.model.save();
  }

  /** Predicted profit and SharpeRatio for investors */
  public async predict(investors: Investors): Promise<DataFrame> {
    const input = this.input(investors);
    const prediction = await this.model.predict(input);
    const names = new TextSeries(investors.map((i) => i.UserName));
    const result = new DataFrame({
      UserName: names,
    }).join(prediction);

    return result;
  }
}
