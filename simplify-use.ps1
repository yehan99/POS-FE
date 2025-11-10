# Simplify @use statements - only use mixins which forwards variables
$scssFiles = Get-ChildItem -Path "src/app" -Filter "*.scss" -Recurse

foreach ($file in $scssFiles) {
    $content = Get-Content $file.FullName -Raw

    # Remove variables import line (keep mixins which now forwards variables)
    $content = $content -replace '@use "[^"]*variables" as \*;\r?\n', ''

    Set-Content $file.FullName -Value $content -NoNewline
}

Write-Host "Simplified @use statements in $($scssFiles.Count) SCSS files"
