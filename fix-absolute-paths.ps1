# Use absolute paths from src
$scssFiles = Get-ChildItem -Path "src/app" -Filter "*.scss" -Recurse

foreach ($file in $scssFiles) {
    $content = Get-Content $file.FullName -Raw

    # Replace all @use statements with absolute path from src
    $content = $content -replace '@use "[^"]*variables" as \*;', '@use "/src/styles/variables" as *;'
    $content = $content -replace '@use "[^"]*mixins" as \*;', '@use "/src/styles/mixins" as *;'

    Set-Content $file.FullName -Value $content -NoNewline
}

Write-Host "Updated to absolute paths in $($scssFiles.Count) SCSS files"
