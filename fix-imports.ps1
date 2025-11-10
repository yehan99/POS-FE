# Fix Sass imports to use _underscore prefix
$scssFiles = Get-ChildItem -Path "src" -Filter "*.scss" -Recurse

foreach ($file in $scssFiles) {
    $content = Get-Content $file.FullName -Raw

    # Replace imports to use absolute paths with _underscore prefix
    $content = $content -replace '@import\s+"[\.\/]+styles/variables";', '@import "src/styles/_variables";'
    $content = $content -replace '@import\s+"[\.\/]+styles/mixins";', '@import "src/styles/_mixins";'
    $content = $content -replace '@import\s+"\./variables";', '@import "src/styles/_variables";'
    $content = $content -replace '@import\s+"\./mixins";', '@import "src/styles/_mixins";'
    $content = $content -replace '@import\s+"variables";', '@import "src/styles/_variables";'
    $content = $content -replace '@import\s+"mixins";', '@import "src/styles/_mixins";'

    Set-Content $file.FullName -Value $content -NoNewline
}

Write-Host "Fixed imports in $($scssFiles.Count) SCSS files"
