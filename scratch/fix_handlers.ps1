$path = "src/pages/Admin/index.tsx"
$content = Get-Content $path
$newContent = $content -replace 'setConfirmHandler\(async \(\) => \{', 'setConfirmHandler(() => async () => {'
$newContent | Set-Content $path
