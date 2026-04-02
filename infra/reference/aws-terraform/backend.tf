# ---------------------------------------------------------
# S3 + DynamoDB remote state backend
# Uncomment and configure at terraform init time:
#
#   terraform init \
#     -backend-config="bucket=ims-tfstate-${ENV}" \
#     -backend-config="key=ims-gen2/terraform.tfstate" \
#     -backend-config="region=us-east-1" \
#     -backend-config="dynamodb_table=ims-tfstate-lock-${ENV}"
# ---------------------------------------------------------

# terraform {
#   backend "s3" {
#     bucket         = "ims-tfstate-dev"
#     key            = "ims-gen2/terraform.tfstate"
#     region         = "us-east-1"
#     encrypt        = true
#     dynamodb_table = "ims-tfstate-lock-dev"
#   }
# }
