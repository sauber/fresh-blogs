import { defineRoute } from "$fresh/server.ts";
import type { Investors } from "📚/repository/mod.ts";
import { community_latest } from "../../data/repo.ts";
import InvestorList from "📦/community/List.tsx";
import Feature from "📦/ux/Feature.tsx";

export default defineRoute(async (req, ctx) => {
  const list: Investors = await community_latest();

  return (
    <Feature>
      <InvestorList investors={list} />
    </Feature>
  );
});
