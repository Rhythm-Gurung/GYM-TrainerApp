$files = Get-ChildItem -Path "e:\GYMJAM\GYM-TrainerApp\src" -Recurse -Include "*.tsx","*.ts"
$modified = @()
foreach ($file in $files) {
    $original = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $content = $original
    $content = $content -replace "text-gray-900", "text-foreground"
    $content = $content -replace "text-gray-800", "text-foreground"
    $content = $content -replace "text-gray-700", "text-foreground-2"
    $content = $content -replace "text-gray-600", "text-foreground-3"
    $content = $content -replace "text-gray-500", "text-foreground-4"
    $content = $content -replace "text-gray-400", "text-foreground-5"
    $content = $content -replace "bg-gray-50", "bg-surface-subtle"
    $content = $content -replace "bg-gray-100", "bg-surface"
    $content = $content -replace "bg-gray-200", "bg-surface-border"
    $content = $content -replace "bg-gray-300", "bg-neutral"
    $content = $content -replace "border-gray-50", "border-surface-subtle"
    $content = $content -replace "border-gray-100", "border-surface"
    $content = $content -replace "border-gray-200", "border-surface-border"
    $content = $content -replace "border-gray-300", "border-neutral"
    $content = $content -replace "text-red-500", "text-error"
    $content = $content -replace "border-red-400", "border-error-light"
    $content = $content -replace "border-red-200", "border-error-border"
    $content = $content -replace "active:bg-red-50", "active:bg-error-bg"
    $content = $content -replace "bg-red-50", "bg-error-bg"
    $content = $content -replace "text-blue-600", "text-action-dark"
    $content = $content -replace "bg-blue-600", "bg-action-dark"
    $content = $content -replace "border-blue-600", "border-action-dark"
    $content = $content -replace "text-blue-500", "text-action"
    $content = $content -replace "bg-blue-500", "bg-action"
    $content = $content -replace "bg-blue-100", "bg-action-bg"
    $content = $content -replace "bg-green-100", "bg-status-new-bg"
    $content = $content -replace "bg-purple-100", "bg-system-bg"
    $content = $content -replace "text-orange-500", "text-cancel"
    $content = $content -replace "border-orange-500", "border-cancel"
    if ($content -ne $original) {
        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
        $modified += $file.FullName
    }
}
Write-Host "=== COLOR REPLACEMENTS COMPLETE ==="
Write-Host "Modified $($modified.Count) file(s):"
$modified | ForEach-Object { Write-Host "  $_" }
