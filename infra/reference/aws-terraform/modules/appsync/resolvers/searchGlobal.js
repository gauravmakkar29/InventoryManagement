import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const { query, limit } = ctx.args;
  return {
    version: "2018-05-29",
    method: "POST",
    resourcePath: "/_search",
    params: {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        size: limit || 25,
        query: {
          multi_match: {
            query: query,
            fields: ["*"],
            type: "best_fields",
            fuzziness: "AUTO",
          },
        },
      }),
    },
  };
}

export function response(ctx) {
  if (ctx.error) {
    return util.error(ctx.error.message, ctx.error.type);
  }
  const body = JSON.parse(ctx.result.body);
  const items = body.hits.hits.map((hit) => ({
    entityType: hit._source.entityType,
    PK: hit._source.PK,
    SK: hit._source.SK,
    highlight: JSON.stringify(hit.highlight || {}),
    score: hit._score,
  }));
  return { items, total: body.hits.total.value };
}
