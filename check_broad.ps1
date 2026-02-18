
$files = Get-ChildItem -Path "e:\GYMJAM\GYM-TrainerApp\src" -Recurse -Include "*.tsx","*.ts"
Write-Host "=== All numeric-suffix gray/red/blue/green/purple/orange bg/text/border patterns ==="
$patterns = @("text-gray-[0-9]","bg-gray-[0-9]","border-gray-[0-9]","text-red-[0-9]","bg-red-[0-9]","border-red-[0-9]","text-blue-[0-9]","bg-blue-[0-9]","border-blue-[0-9]","text-orange-[0-9]","border-orange-[0-9]","bg-green-[0-9]","bg-purple-[0-9]")
foreach ($pat in $patterns) {
    $m = Select-String -Path $files.FullName -Pattern $pat
    if ($m.Count -gt 0) {
        Write-Host "FOUND ($($m.Count) matches) - $pat"
        $m | Select-Object -First 3 | ForEach-Object { Write-Host "   $($_.Filename):$($_.LineNumber): $($_.Line.Trim())" }
    }
}
Write-Host ""
Write-Host "=== text-xl/2xl/3xl/4xl/lg ==="
$sizePatterns = @("text-4xl","text-3xl","text-2xl","text-xl","text-lg")
foreach ($pat in $sizePatterns) {
    $m = Select-String -Path $files.FullName -Pattern $pat
    if ($m.Count -gt 0) {
        Write-Host "FOUND ($($m.Count) matches) - $pat"
        $m | Select-Object -First 3 | ForEach-Object { Write-Host "   $($_.Filename):$($_.LineNumber): $($_.Line.Trim())" }
    }
}
Write-Host ""
Write-Host "=== bg-[#hex] patterns ==="
$m = Select-String -Path $files.FullName -Pattern "bg-\[#|text-\[#|border-\[#"
if ($m.Count -gt 0) {
    Write-Host "FOUND ($($m.Count) matches)"
    $m | Select-Object -First 5 | ForEach-Object { Write-Host "   $($_.Filename):$($_.LineNumber): $($_.Line.Trim())" }
} else {
    Write-Host "NONE found"
}
