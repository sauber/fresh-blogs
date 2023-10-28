import { createHandler, ServeHandlerInfo } from "$fresh/server.ts";
import manifest from "../fresh.gen.ts";
import { assertEquals } from "$std/testing/asserts.ts";
import type { DateFormat } from "/utils/time/mod.ts";
import { assertInstanceOf } from "assert";
import type { Names, InvestorExport } from "/investor/mod.ts";

const CONN_INFO: ServeHandlerInfo = {
  remoteAddr: { hostname: "127.0.0.1", port: 53496, transport: "tcp" },
};

Deno.test("HTTP assert test.", async (t) => {
  const handler = await createHandler(manifest);

  await t.step("#1 GET /api/investor/end", async () => {
    const resp = await handler(
      new Request("http://127.0.0.1/api/investor/end"),
      CONN_INFO
    );
    assertEquals(resp.status, 200);
    const date: DateFormat = await resp.json();
    assertEquals(date, "2023-10-23");
  });

  await t.step("#2 GET /api/investor/names/last", async () => {
    const resp = await handler(
      new Request("http://127.0.0.1/api/investor/names/last"),
      CONN_INFO
    );
    assertEquals(resp.status, 200);
    const names: Names = await resp.json();
    assertInstanceOf(names, Array<string>);
  });

  await t.step("#3 GET /api/investor/FundManagerZech/last", async () => {
    const resp = await handler(
      new Request("http://127.0.0.1/api/investor/FundManagerZech/last"),
      CONN_INFO
    );
    assertEquals(resp.status, 200);
    const data = await resp.json() as InvestorExport;
    assertEquals(data.stats.UserName, "FundManagerZech");
  });



  /*
  await t.step("#2 POST /", async () => {
    const formData = new FormData();
    formData.append("text", "Deno!");
    const req = new Request("http://127.0.0.1/", {
      method: "POST",
      body: formData,
    });
    const resp = await handler(req, CONN_INFO);
    assertEquals(resp.status, 303);
  });

  await t.step("#3 GET /foo", async () => {
    const resp = await handler(new Request("http://127.0.0.1/foo"), CONN_INFO);
    const text = await resp.text();
    assert(text.includes("<div>Hello Foo!</div>"));
  });
  */
});
