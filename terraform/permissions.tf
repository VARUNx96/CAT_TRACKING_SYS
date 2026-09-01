# 1. Create the IAM User
resource "aws_iam_user" "db_operator" {
  name = "rental-db-operator"
}

# 2. Restrict permissions strictly to DB operations (No table edits/deletions)
resource "aws_iam_policy" "db_operations_only" {
  name        = "DynamoDBDataOperationsOnly"
  description = "Allows data-plane actions (read, write, update, delete items) only"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowDataPlaneOperations"
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:BatchGetItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:BatchWriteItem"
        ]
        Resource = [
          aws_dynamodb_table.smart_rental_tracking.arn,
          "${aws_dynamodb_table.smart_rental_tracking.arn}/index/*"
        ]
      }
    ]
  })
}

# 3. Attach the policy to the user
resource "aws_iam_user_policy_attachment" "attach_db_operator" {
  user       = aws_iam_user.db_operator.name
  policy_arn = aws_iam_policy.db_operations_only.arn
}

# 4. Generate Programmatic Access Keys (Access Key ID & Secret)
resource "aws_iam_access_key" "db_operator_key" {
  user = aws_iam_user.db_operator.name
}

# 5. Output the credentials so you can share them
output "db_operator_access_key_id" {
  value       = aws_iam_access_key.db_operator_key.id
  description = "Access Key ID for the database operator"
}

output "db_operator_secret_access_key" {
  value       = aws_iam_access_key.db_operator_key.secret
  sensitive   = true
  description = "Secret Access Key for the database operator"
}
