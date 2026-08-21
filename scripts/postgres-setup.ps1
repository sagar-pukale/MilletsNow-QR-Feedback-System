$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $root '.env'
$statusPath = Join-Path $root '.postgres-setup-status.json'
$psql = 'C:\Program Files\PostgreSQL\18\bin\psql.exe'
$createdb = 'C:\Program Files\PostgreSQL\18\bin\createdb.exe'
$dbName = 'milletsnow'
$dbHost = 'localhost'
$dbPort = 5432
$dbUser = 'postgres'

function Write-Status($success, $message, $details) {
  $payload = [pscustomobject]@{
    success = $success
    message = $message
    details = $details
    updatedAt = (Get-Date).ToString('o')
  }
  $payload | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $statusPath -Encoding UTF8
}

function Read-EnvMap($path) {
  $map = [ordered]@{}
  if (-not (Test-Path $path)) { return $map }
  foreach ($line in Get-Content -LiteralPath $path) {
    if ($line -match '^(?!\s*#)([^=]+)=(.*)$') {
      $map[$matches[1].Trim()] = $matches[2]
    }
  }
  return $map
}

function Update-EnvLine($path, $key, $value) {
  $lines = if (Test-Path $path) { [System.Collections.Generic.List[string]](Get-Content -LiteralPath $path) } else { [System.Collections.Generic.List[string]]::new() }
  $pattern = "^{0}=" -f [regex]::Escape($key)
  $updated = $false
  for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match $pattern) {
      $lines[$i] = "$key=$value"
      $updated = $true
      break
    }
  }
  if (-not $updated) {
    $lines.Add("$key=$value")
  }
  Set-Content -LiteralPath $path -Value $lines -Encoding UTF8
}

try {
  if (-not (Test-Path $psql)) { throw "psql.exe not found at expected path." }
  if (-not (Test-Path $createdb)) { throw "createdb.exe not found at expected path." }

  $securePassword = Read-Host -AsSecureString 'Enter the local PostgreSQL password for user postgres'
  $plainPassword = [System.Net.NetworkCredential]::new('', $securePassword).Password
  if ([string]::IsNullOrWhiteSpace($plainPassword)) {
    throw 'No PostgreSQL password was entered.'
  }

  $env:PGPASSWORD = $plainPassword

  & $psql -h $dbHost -p $dbPort -U $dbUser -d postgres -tAc 'SELECT 1' | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw 'PostgreSQL authentication failed for user postgres.'
  }

  $dbExists = & $psql -h $dbHost -p $dbPort -U $dbUser -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$dbName'"
  if ($LASTEXITCODE -ne 0) {
    throw 'Unable to determine whether the milletsnow database exists.'
  }
  if (-not (($dbExists | Out-String).Trim() -eq '1')) {
    & $createdb -h $dbHost -p $dbPort -U $dbUser $dbName | Out-Null
    if ($LASTEXITCODE -ne 0) {
      throw 'Failed to create the milletsnow database.'
    }
  }

  $encodedPassword = [Uri]::EscapeDataString($plainPassword)
  $databaseUrl = "postgresql://$dbUser:$encodedPassword@$dbHost`:$dbPort/$dbName?schema=public"
  Update-EnvLine -path $envPath -key 'DATABASE_URL' -value $databaseUrl

  $envMap = Read-EnvMap $envPath
  $details = [pscustomobject]@{
    host = $dbHost
    port = $dbPort
    database = $dbName
    username = $dbUser
    envUpdated = $true
    hasAdminEmail = [bool]$envMap.Contains('ADMIN_EMAIL')
    hasAdminPassword = [bool]$envMap.Contains('ADMIN_PASSWORD')
  }
  Write-Status -success $true -message 'PostgreSQL password accepted and .env updated.' -details $details
  Write-Host 'PostgreSQL setup completed. You can close this window.'
}
catch {
  Write-Status -success $false -message $_.Exception.Message -details @{}
  Write-Error $_.Exception.Message
}
finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
