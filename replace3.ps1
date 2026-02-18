$files = Get-ChildItem -Path "e:\GYMJAM\GYM-TrainerApp\src" -Recurse -Include "*.tsx","*.ts"
$modified = @()
foreach ($file in $files) {
    $original = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $content = $original
    $content = $content -replace "bg-\[#73C2FB\]", "bg-primary-btn"
    $content = $content -replace "bg-\[#73c2fb\]", "bg-primary-btn"
    $content = $content -replace "text-\[#73C2FB\]", "text-primary-btn"
    $content = $content -replace "text-\[#73c2fb\]", "text-primary-btn"
    $content = $content -replace "border-\[#73C2FB\]", "border-primary-btn"
    $content = $content -replace "border-\[#73c2fb\]", "border-primary-btn"
    $content = $content -replace "bg-\[#FBFBFB\]", "bg-background"
    $content = $content -replace "bg-\[#fbfbfb\]", "bg-background"
    if ($content -ne $original) {
        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
        $modified += $file.FullName
    }
}
Write-Host "=== HEX COLOR REPLACEMENTS COMPLETE ==="
Write-Host "Modified $($modified.Count) file(s):"
$modified | ForEach-Object { Write-Host "  $_" }
