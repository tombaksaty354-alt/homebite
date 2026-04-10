# PowerShell Script untuk menambahkan environment variables ke Vercel
# Jalankan script ini setelah Anda memiliki Vercel API Token

Write-Host "=== Vercel Environment Variables Setup ===" -ForegroundColor Cyan
Write-Host ""

# Environment variables yang akan ditambahkan
$envVars = @{
    "NEXT_PUBLIC_SUPABASE_URL" = "https://wibsjoskduaqqvkywgsa.supabase.co"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpYnNqb3NrZHVhcXF2a3l3Z3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMDIwMjYsImV4cCI6MjA5MDc3ODAyNn0.yoVNvtZ2sW_oShgwdXLcoRZb-V_kUR1fLWoJ2VxtLcw"
    "JWT_SECRET" = "ccadcbd8-b101-42bc-a0da-58f4cf85263c"
}

Write-Host "Environment variables yang akan ditambahkan:" -ForegroundColor Yellow
foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    $displayValue = if ($value.Length -gt 20) { "$($value.Substring(0, 20))..." } else { $value }
    Write-Host "  - $key = $displayValue" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== INSTRUKSI ===" -ForegroundColor Yellow
Write-Host ""
Write-Host "Karena Vercel CLI memerlukan setup project yang benar, cara paling mudah adalah:" -ForegroundColor White
Write-Host ""
Write-Host "1. Buka Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor Cyan
Write-Host "2. Klik project Anda (homebite atau nama lainnya)" -ForegroundColor Cyan
Write-Host "3. Klik tab 'Settings' di atas" -ForegroundColor Cyan
Write-Host "4. Klik 'Environment Variables' di menu kiri" -ForegroundColor Cyan
Write-Host "5. Klik 'Add New' dan tambahkan variables berikut:" -ForegroundColor Cyan
Write-Host ""

foreach ($key in $envVars.Keys) {
    Write-Host "   Name:  $key" -ForegroundColor White
    Write-Host "   Value: $($envVars[$key])" -ForegroundColor White
    Write-Host "   Environment: Production ✓ Preview ✓ Development ✓" -ForegroundColor White
    Write-Host ""
}

Write-Host "6. Setelah menambahkan semua, klik 'Redeploy' dari deployment terakhir" -ForegroundColor Cyan
Write-Host ""
Write-Host "=== ALTERNATIF: Via Vercel CLI ===" -ForegroundColor Yellow
Write-Host ""
Write-Host "Jika ingin menggunakan CLI, jalankan perintah berikut satu per satu:" -ForegroundColor White
Write-Host ""

foreach ($key in $envVars.Keys) {
    Write-Host "vercel env add $key" -ForegroundColor Gray
    Write-Host "  Paste value: $($envVars[$key])" -ForegroundColor Gray
    Write-Host "  Pilih environments: semua (production, preview, development)" -ForegroundColor Gray
    Write-Host ""
}

Write-Host ""
Write-Host "Apakah Anda ingin saya buka Vercel Dashboard untuk Anda?" -ForegroundColor Yellow
$open = Read-Host "Ketik 'yes' untuk membuka dashboard (yes/no)"
if ($open -eq "yes") {
    Start-Process "https://vercel.com/dashboard"
    Write-Host "Dashboard Vercel sudah dibuka di browser!" -ForegroundColor Green
}
