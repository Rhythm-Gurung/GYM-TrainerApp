
$files = Get-ChildItem -Path "e:\GYMJAM\GYM-TrainerApp\src" -Recurse -Include "*.tsx","*.ts"
$m = Select-String -Path $files.FullName -Pattern "bg-\[#|text-\[#|border-\[#"
Write-Host "All hex class matches ($($m.Count) total):"
$m | ForEach-Object { Write-Host "$($_.Filename):$($_.LineNumber): $($_.Line.Trim())" }
