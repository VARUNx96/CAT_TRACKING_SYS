resource "aws_cognito_user_pool" "rental_users" {
  name = "smart-rental-users"

  # Users sign in using their email address
  username_attributes = ["email"]

  # Cognito automatically sends email verification
  auto_verified_attributes = ["email"]

  # No MFA for the initial implementation
  mfa_configuration = "OFF"

  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = false
    temporary_password_validity_days = 7
  }

  # Send a verification code to the user's email
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  tags = {
    Project = "SmartRental"
    Purpose = "Authentication"
  }
}

resource "aws_cognito_user_pool_client" "frontend" {
  name         = "smart-rental-frontend"
  user_pool_id = aws_cognito_user_pool.rental_users.id

  # Frontend/mobile clients must not have a client secret
  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]

  prevent_user_existence_errors = "ENABLED"

  access_token_validity  = 60
  id_token_validity      = 60
  refresh_token_validity = 30

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }
}