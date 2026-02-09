
$envPath = "$PSScriptRoot\..\.env"
if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        if ($_ -match '^\s*([^#=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            if (-not [string]::IsNullOrEmpty($key)) {
                [Environment]::SetEnvironmentVariable($key, $value, "Process")
                Write-Host "Set env: $key"
            }
        }
    }
} else {
    Write-Host "No .env file found at $envPath" -ForegroundColor Red
}

Set-Location "$PSScriptRoot\.."
.\gradlew bootRun
