
resource "aws_iam_user" "db_operator" {
  name = "rental-db-operator"
}

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


resource "aws_iam_user_policy_attachment" "attach_db_operator" {
  user       = aws_iam_user.db_operator.name
  policy_arn = aws_iam_policy.db_operations_only.arn
}


resource "aws_iam_access_key" "db_operator_key" {
  user = aws_iam_user.db_operator.name
}


output "db_operator_access_key_id" {
  value       = aws_iam_access_key.db_operator_key.id
  description = "Access Key ID for the database operator"
}

output "db_operator_secret_access_key" {
  value       = aws_iam_access_key.db_operator_key.secret
  sensitive   = true
  description = "Secret Access Key for the database operator"
}

resource "aws_iam_role_policy" "ec2_dynamodb_access" {
  name = "SmartRentalDynamoDBAccess"
  role = "smart-rental-ec2-role"

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Sid    = "AllowDynamoDBDataOperations"
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