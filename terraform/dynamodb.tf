provider "aws" {
  region = "us-east-1" # Set your preferred AWS region
}

resource "aws_dynamodb_table" "smart_rental_tracking" {
  name         = "SmartRentalTracking"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "EquipmentID"
  range_key    = "CheckOutDate"

  # Base table key attributes
  attribute {
    name = "EquipmentID"
    type = "S"
  }

  attribute {
    name = "CheckOutDate"
    type = "S"
  }

  # Additional attributes needed for GSIs
  attribute {
    name = "SiteID"
    type = "S"
  }

  attribute {
    name = "CheckInDate"
    type = "S"
  }

  attribute {
    name = "Type"
    type = "S"
  }

  # GSI 1: Site-wise querying (Asset Dashboard & Site Logs)
  global_secondary_index {
    name            = "SiteID-CheckInDate-index"
    hash_key        = "SiteID"
    range_key       = "CheckInDate"
    projection_type = "ALL"
  }

  # GSI 2: Equipment type querying (Demand Forecasting & Utilization)
  global_secondary_index {
    name            = "Type-CheckOutDate-index"
    hash_key        = "Type"
    range_key       = "CheckOutDate"
    projection_type = "ALL"
  }

  tags = {
    Environment = "Dev"
    Project     = "SmartRentalTrackingSystem"
  }
}

resource "aws_dynamodb_table_item" "rental_items" {
  for_each = {
    "EQX1001" = {
      equipment_id = "EQX1001", type = "Excavator", site_id = "S003",
      check_out    = "2025-04-01", check_in = "2025-04-16",
      engine_hrs   = "1.5", idle_hrs = "10", op_days = "15", operator_id = "OP101"
    }
    "EQX1002" = {
      equipment_id = "EQX1002", type = "Crane", site_id = null,
      check_out    = "2025-03-10", check_in = "2025-03-30",
      engine_hrs   = "0", idle_hrs = "11", op_days = "20", operator_id = null
    }
    "EQX1003" = {
      equipment_id = "EQX1003", type = "Bulldozer", site_id = "S002",
      check_out    = "2025-02-15", check_in = "2025-03-11",
      engine_hrs   = "7.5", idle_hrs = "0.5", op_days = "25", operator_id = "OP203"
    }
    "EQX1004" = {
      equipment_id = "EQX1004", type = "Excavator", site_id = "S004",
      check_out    = "2025-05-05", check_in = "2025-05-15",
      engine_hrs   = "2", idle_hrs = "9", op_days = "10", operator_id = "OP106"
    }
    "EQX1005" = {
      equipment_id = "EQX1005", type = "Bulldozer", site_id = "S006",
      check_out    = "2025-01-01", check_in = "2025-01-31",
      engine_hrs   = "8", idle_hrs = "0", op_days = "30", operator_id = "OP301"
    }
    "EQX1006" = {
      equipment_id = "EQX1006", type = "Grader", site_id = "S001",
      check_out    = "2025-04-05", check_in = "2025-04-23",
      engine_hrs   = "3", idle_hrs = "6", op_days = "18", operator_id = "OP114"
    }
    "EQX1007" = {
      equipment_id = "EQX1007", type = "Excavator", site_id = null,
      check_out    = "2025-03-20", check_in = "2025-04-01",
      engine_hrs   = "0", idle_hrs = "12", op_days = "12", operator_id = null
    }
  }

  table_name = aws_dynamodb_table.smart_rental_tracking.name
  hash_key   = aws_dynamodb_table.smart_rental_tracking.hash_key
  range_key  = aws_dynamodb_table.smart_rental_tracking.range_key

  item = jsonencode(merge(
    {
      "EquipmentID" : { "S" : each.value.equipment_id },
      "CheckOutDate" : { "S" : each.value.check_out },
      "Type" : { "S" : each.value.type },
      "CheckInDate" : { "S" : each.value.check_in },
      "EngineHoursPerDay" : { "N" : each.value.engine_hrs },
      "IdleHoursPerDay" : { "N" : each.value.idle_hrs },
      "OperatingDays" : { "N" : each.value.op_days }
    },
    each.value.site_id != null ? { "SiteID" : { "S" : each.value.site_id } } : {},
    each.value.operator_id != null ? { "LastOperatorID" : { "S" : each.value.operator_id } } : {}
  ))
}
