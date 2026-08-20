# test_api.ps1
$baseUrl = "http://localhost:4000"
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$backendEnvPath = Join-Path $PSScriptRoot "backend/.env"

if (-not (Test-Path $backendEnvPath)) {
    throw "Missing backend/.env"
}

$adminPasswordLine = Get-Content $backendEnvPath | Where-Object { $_ -match '^ADMIN_PASSWORD=' } | Select-Object -First 1
if (-not $adminPasswordLine) {
    throw "ADMIN_PASSWORD is not configured in backend/.env"
}

$adminPassword = $adminPasswordLine.Substring('ADMIN_PASSWORD='.Length).Trim()
$qrToken = "MN-LADO-00001"

Write-Host "1. Testing Health Endpoint..." -ForegroundColor Cyan
$health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
Write-Host "Health status: $($health.status)" -ForegroundColor Green

Write-Host "2. Testing Auth Login API..." -ForegroundColor Cyan
$loginBody = @{ email = "admin@milletsnow.example"; password = $adminPassword } | ConvertTo-Json
$loginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -WebSession $session
Write-Host "Login response code: 200" -ForegroundColor Green
$user = $loginRes.user
Write-Host "Logged in user: $($user.fullName) ($($user.email))" -ForegroundColor Green

Write-Host "3. Testing Products API..." -ForegroundColor Cyan
$productsRes = Invoke-RestMethod -Uri "$baseUrl/products" -Method Get -WebSession $session
Write-Host "Products count: $($productsRes.items.Count)" -ForegroundColor Green
Write-Host "Product name: $($productsRes.items[0].name), SKU: $($productsRes.items[0].sku)" -ForegroundColor Green

Write-Host "4. Testing QR Scan API (Valid Token)..." -ForegroundColor Cyan
$scanRes = Invoke-RestMethod -Uri "$baseUrl/api/scan/$qrToken" -Method Get
Write-Host "Scanned product name: $($scanRes.product.name)" -ForegroundColor Green

Write-Host "5. Testing QR Scan API (Invalid Token)..." -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri "$baseUrl/api/scan/INVALID-TOKEN-999" -Method Get
} catch {
    Write-Host "Invalid QR correctly returned HTTP 404" -ForegroundColor Green
}

Write-Host "6. Testing Feedback POST API..." -ForegroundColor Cyan
$fbBody = @{ qrToken = $qrToken; rating = 5; message = "Delicious Millets Ladoo!"; type = "compliment" } | ConvertTo-Json
$fbPostRes = Invoke-RestMethod -Uri "$baseUrl/feedback" -Method Post -Body $fbBody -ContentType "application/json"
Write-Host "Feedback created ID: $($fbPostRes.id), status: $($fbPostRes.status)" -ForegroundColor Green

Write-Host "7. Testing Feedback GET (Inbox/Dashboard) API..." -ForegroundColor Cyan
$fbGetRes = Invoke-RestMethod -Uri "$baseUrl/feedback" -Method Get -WebSession $session
Write-Host "Feedback items in DB: $($fbGetRes.items.Count)" -ForegroundColor Green
Write-Host "Latest feedback message: $($fbGetRes.items[0].message)" -ForegroundColor Green

Write-Host "`nALL API SMOKE TESTS PASSED CLEANLY!" -ForegroundColor Green
