output "ec2_public_ip" {
  description = "EC2 Public IP"
  value       = aws_instance.web.public_ip
}

output "ec2_public_dns" {
  description = "EC2 Public DNS"
  value       = aws_instance.web.public_dns
}

output "rds_endpoint" {
  description = "RDS Endpoint (GitHub Secrets RDS_ENDPOINT에 입력)"
  value       = aws_db_instance.mysql.endpoint
}

output "ssh_command" {
  description = "SSH 접속 명령"
  value       = "ssh -i ~/.ssh/id_rsa ec2-user@${aws_instance.web.public_ip}"
}
