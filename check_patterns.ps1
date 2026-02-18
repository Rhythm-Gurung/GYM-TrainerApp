
$files = Get-ChildItem -Path "e:\GYMJAM\GYM-TrainerApp\src" -Recurse -Include "*.tsx","*.ts"
Write-Host "Total files found: $($files.Count)"
$match = Select-String -Path $files.FullName -Pattern "text-gray-" -SimpleMatch
Write-Host "Lines with text-gray-: $($match.Count)"
$match | Select-Object -First 5 | ForEach-Object { Write-Host "$($_.Filename):$($_.LineNumber): $($_.Line.Trim())" }
