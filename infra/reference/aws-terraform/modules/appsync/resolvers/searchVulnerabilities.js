import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const { query, filters, limit } = ctx.args;
  const must = [
    { match: { entityType: "VULNERABILITY" } },
    {
      multi_match: {
        query: query,
        fields: ["cveId", "description", "remediation"],
        fuzziness: "AUTO",
      },
    },
  ];

  if (filters) {
    if (filters.severity) must.push({ term: { severity: filters.severity } });
    if (filters.status) must.push({ term: { status: filters.status } });
  }

  return {
    version: "2018-05-29",
    method: "POST",
    resourcePath: "/_search",
    params: {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        size: limit || 50,
        query: { bool: { must } },
      }),
    },
  };
}

export function response(ctx) {
  if (ctx.error) {
    return util.error(ctx.error.message, ctx.error.type);
  }
  const body = JSON.parse(ctx.result.body);
  const items = body.hits.hits.map((hit) => hit._source);
  return { items, nextToken: null };
}
