output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.rental_users.id
}

output "cognito_user_pool_arn" {
  value = aws_cognito_user_pool.rental_users.arn
}

output "cognito_client_id" {
  value = aws_cognito_user_pool_client.frontend.id
}

output "cognito_region" {
  value = "us-east-1"
}
