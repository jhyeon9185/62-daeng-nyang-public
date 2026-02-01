output "ec2_public_ip" {
  description = "EC2 Elastic IP (고정 IP)"
  value       = aws_eip.web.public_ip
}

output "ec2_public_dns" {
  description = "EC2 Public DNS"
  value       = aws_eip.web.public_dns
}

output "rds_endpoint" {
  description = "RDS Endpoint (GitHub Secrets RDS_ENDPOINT에 입력)"
  value       = aws_db_instance.mysql.endpoint
}

output "ssh_command" {
  description = "SSH 접속 명령"
  value       = "ssh -i ~/.ssh/nas_deploy_key ec2-user@${aws_eip.web.public_ip}"
}

output "website_url" {
  description = "웹사이트 접속 주소"
  value       = "http://${aws_eip.web.public_ip}"
}
