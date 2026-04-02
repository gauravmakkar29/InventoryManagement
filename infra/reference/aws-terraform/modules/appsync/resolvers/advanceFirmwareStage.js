import { util } from "@aws-appsync/utils";

const STAGE_ORDER = ["UPLOADED", "TESTING", "STAGING", "CANARY", "PRODUCTION"];

export function request(ctx) {
  const { PK, SK, targetStage } = ctx.args;

  if (!STAGE_ORDER.includes(targetStage)) {
    util.error(`Invalid target stage: ${targetStage}. Valid stages: ${STAGE_ORDER.join(", ")}`, "ValidationError");
  }

  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({ PK, SK }),
    update: {
      expression: "SET stage = :stage, updatedAt = :now",
      expressionValues: util.dynamodb.toMapValues({
        ":stage": targetStage,
        ":now": util.time.nowISO8601(),
      }),
    },
    condition: {
      expression: "attribute_exists(PK) AND #status = :approved",
      expressionNames: { "#status": "status" },
      expressionValues: util.dynamodb.toMapValues({
        ":approved": "APPROVED",
      }),
    },
  };
}

export function response(ctx) {
  if (ctx.error) {
    if (ctx.error.type === "DynamoDB:ConditionalCheckFailedException") {
      return util.error("Firmware must be APPROVED before advancing stages", "PreconditionFailed");
    }
    return util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.result;
}
