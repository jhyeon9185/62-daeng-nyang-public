variable "aws_region" {
  description = "AWS Region"
  type        = string
  default     = "ap-northeast-2"
}

variable "ssh_public_key_path" {
  description = "SSH public key path"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

variable "db_name" {
  description = "RDS database name"
  type        = string
  default     = "dn_platform"
}

variable "db_username" {
  description = "RDS username"
  type        = string
  default     = "dnadmin"
}

variable "db_password" {
  description = "RDS password"
  type        = string
  sensitive   = true
}
