import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const { input } = ctx.args;
  const now = util.time.nowISO8601();
  const item = {
    ...input,
    createdAt: now,
    updatedAt: now,
    createdBy: ctx.identity.username || ctx.identity.sub,
  };
  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({
      PK: input.PK,
      SK: input.SK,
    }),
    attributeValues: util.dynamodb.toMapValues(item),
    condition: {
      expression: "attribute_not_exists(PK)",
    },
  };
}

export function response(ctx) {
  if (ctx.error) {
    return util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.result;
}
