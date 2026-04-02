import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const { PK, SK, approverUserId } = ctx.args;

  // First, get the firmware record to check separation of duties
  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({ PK, SK }),
  };
}

export function response(ctx) {
  if (ctx.error) {
    return util.error(ctx.error.message, ctx.error.type);
  }

  const firmware = ctx.result;
  if (!firmware) {
    return util.error("Firmware record not found", "NotFound");
  }

  // Separation of Duties: approver cannot be the same as uploader
  if (firmware.uploadedBy === ctx.args.approverUserId) {
    return util.error(
      "Separation of Duties violation: approver cannot be the same as the uploader",
      "SeparationOfDutiesError"
    );
  }

  // Proceed with the update via a second operation
  return {
    ...firmware,
    status: "APPROVED",
    approvedBy: ctx.args.approverUserId,
    updatedAt: util.time.nowISO8601(),
  };
}
