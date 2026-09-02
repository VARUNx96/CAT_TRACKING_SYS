resource "aws_vpc" "smart_rental_vpc" {
  cidr_block = "10.0.0.0/16"

  tags = {
    Name = "smart-rental-vpc"
  }
}

resource "aws_subnet" "smart_rental_public" {
  vpc_id                  = aws_vpc.smart_rental_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true

  tags = {
    Name = "smart-rental-public-subnet"
  }
}

resource "aws_internet_gateway" "smart_rental_gateway" {
  vpc_id = aws_vpc.smart_rental_vpc.id

  tags = {
    Name = "smart-rental-internet-gateway"
  }
}

resource "aws_route_table" "smart_rental_public" {
  vpc_id = aws_vpc.smart_rental_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.smart_rental_gateway.id
  }

  tags = {
    Name = "smart-rental-public-route-table"
  }
}

resource "aws_route_table_association" "smart_rental_public" {
  subnet_id      = aws_subnet.smart_rental_public.id
  route_table_id = aws_route_table.smart_rental_public.id
}

resource "aws_security_group" "smart_rental_ec2" {

  name = "smart-rental-ec2-sg"

  description = "Security group for Smart Rental Tracking EC2"

  vpc_id = aws_vpc.smart_rental_vpc.id

  # SSH

  ingress {

    description = "SSH"

    from_port = 22

    to_port = 22

    protocol = "tcp"

    cidr_blocks = ["0.0.0.0/0"]

  }

  # FastAPI

  ingress {

    description = "FastAPI"

    from_port = 8000

    to_port = 8000

    protocol = "tcp"

    cidr_blocks = ["0.0.0.0/0"]

  }

  ingress {

    description = "backend"

    from_port = 30080

    to_port = 30080

    protocol = "tcp"

    cidr_blocks = ["0.0.0.0/0"]

  }

  # HTTP

  ingress {

    description = "HTTP"

    from_port = 80

    to_port = 80

    protocol = "tcp"

    cidr_blocks = ["0.0.0.0/0"]

  }

  # HTTPS

  ingress {

    description = "HTTPS"

    from_port = 443

    to_port = 443

    protocol = "tcp"

    cidr_blocks = ["0.0.0.0/0"]

  }

  # Allow all outbound traffic

  egress {

    from_port = 0

    to_port = 0

    protocol = "-1"

    cidr_blocks = ["0.0.0.0/0"]

  }

  tags = {

    Name = "smart-rental-ec2-security-group"

  }

}


resource "aws_iam_role" "smart_rental_ec2" {

  name = "smart-rental-ec2-role"

  assume_role_policy = jsonencode({

    Version = "2012-10-17"

    Statement = [

      {

        Effect = "Allow"

        Principal = {

          Service = "ec2.amazonaws.com"

        }

        Action = "sts:AssumeRole"

      }

    ]

  })

  tags = {

    Name = "smart-rental-ec2-role"

  }

}



resource "aws_iam_instance_profile" "smart_rental_ec2" {

  name = "smart-rental-ec2-profile"

  role = aws_iam_role.smart_rental_ec2.name

}


resource "aws_instance" "smart_rental" {

  ami = "ami-0c7217cdde317cfec"

  instance_type = "t3.small"
  key_name = "smart-rental-key"

  subnet_id = aws_subnet.smart_rental_public.id

  vpc_security_group_ids = [

    aws_security_group.smart_rental_ec2.id

  ]

  iam_instance_profile = aws_iam_instance_profile.smart_rental_ec2.name

  associate_public_ip_address = true

  root_block_device {

    volume_size = 30

    volume_type = "gp3"

  }

  tags = {

    Name = "smart-rental-k3s-server"

  }

}

resource "aws_iam_role_policy_attachment" "smart_rental_ssm" {

  role = aws_iam_role.smart_rental_ec2.name

  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"

}