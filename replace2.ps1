$files = Get-ChildItem -Path "e:\GYMJAM\GYM-TrainerApp\src" -Recurse -Include "*.tsx","*.ts"
$modified = @()
foreach ($file in $files) {
    $original = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $content = $original
    $content = $content -replace "text-4xl", "text-heading"
    $content = $content -replace "text-3xl", "text-title"
    $content = $content -replace "text-2xl", "text-title"
    $content = $content -replace "text-xl", "text-sub-heading"
    $content = $content -replace "text-lg", "text-lead"
    if ($content -ne $original) {
        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
        $modified += $file.FullName
    }
}
Write-Host "=== FONT SIZE REPLACEMENTS COMPLETE ==="
Write-Host "Modified $($modified.Count) file(s):"
$modified | ForEach-Object { Write-Host "  $_" }
