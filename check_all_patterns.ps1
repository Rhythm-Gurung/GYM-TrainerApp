
$files = Get-ChildItem -Path "e:\GYMJAM\GYM-TrainerApp\src" -Recurse -Include "*.tsx","*.ts"
Write-Host "=== text-gray patterns ==="
Select-String -Path $files.FullName -Pattern "text-gray-" -SimpleMatch | Select-Object -First 10 | ForEach-Object { Write-Host "$($_.Filename):$($_.LineNumber): $($_.Line.Trim())" }
Write-Host ""
Write-Host "=== bg-gray patterns ==="
Select-String -Path $files.FullName -Pattern "bg-gray-" -SimpleMatch | Select-Object -First 10 | ForEach-Object { Write-Host "$($_.Filename):$($_.LineNumber): $($_.Line.Trim())" }
Write-Host ""
Write-Host "=== text-blue patterns ==="
Select-String -Path $files.FullName -Pattern "text-blue-" -SimpleMatch | Select-Object -First 10 | ForEach-Object { Write-Host "$($_.Filename):$($_.LineNumber): $($_.Line.Trim())" }
Write-Host ""
Write-Host "=== bg-blue patterns ==="
Select-String -Path $files.FullName -Pattern "bg-blue-" -SimpleMatch | Select-Object -First 10 | ForEach-Object { Write-Host "$($_.Filename):$($_.LineNumber): $($_.Line.Trim())" }
Write-Host ""
Write-Host "=== hex patterns ==="
Select-String -Path $files.FullName -Pattern "#73C2FB|#73c2fb|#FBFBFB|#fbfbfb" -SimpleMatch | Select-Object -First 10 | ForEach-Object { Write-Host "$($_.Filename):$($_.LineNumber): $($_.Line.Trim())" }
Write-Host ""
Write-Host "=== text-xl/2xl/3xl/4xl/lg patterns ==="
Select-String -Path $files.FullName -Pattern "text-xl|text-2xl|text-3xl|text-4xl|text-lg" -SimpleMatch | Select-Object -First 10 | ForEach-Object { Write-Host "$($_.Filename):$($_.LineNumber): $($_.Line.Trim())" }
