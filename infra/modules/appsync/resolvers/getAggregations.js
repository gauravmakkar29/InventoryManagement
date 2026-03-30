import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const { field, filters } = ctx.args;
  const query = filters
    ? { bool: { must: Object.entries(filters).filter(([, v]) => v).map(([k, v]) => ({ term: { [k]: v } })) } }
    : { match_all: {} };

  return {
    version: "2018-05-29",
    method: "POST",
    resourcePath: "/_search",
    params: {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        size: 0,
        query,
        aggs: {
          field_agg: {
            terms: { field: field, size: 100 },
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
  const buckets = body.aggregations.field_agg.buckets.map((b) => ({
    key: b.key,
    count: b.doc_count,
  }));
  return { buckets, total: body.hits.total.value };
}
