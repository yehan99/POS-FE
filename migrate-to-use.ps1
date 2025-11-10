# Migrate from @import to @use for Sass
$scssFiles = Get-ChildItem -Path "src/app" -Filter "*.scss" -Recurse

foreach ($file in $scssFiles) {
    $content = Get-Content $file.FullName -Raw

    # Calculate relative path from file to styles folder
    $relativePath = $file.DirectoryName.Replace((Get-Location).Path + "\src\app", "").Split("\").Length - 1
    $pathPrefix = ("../" * $relativePath) + "../styles/"

    # Replace @import with @use and add namespace
    $content = $content -replace '@import\s+"[^"]*variables";', ('@use "' + $pathPrefix + 'variables" as *;')
    $content = $content -replace '@import\s+"[^"]*mixins";', ('@use "' + $pathPrefix + 'mixins" as *;')

    Set-Content $file.FullName -Value $content -NoNewline
}

# Fix src/styles.scss
$stylesScss = "src/styles.scss"
$content = Get-Content $stylesScss -Raw
$content = $content -replace '@import\s+"[^"]*variables";', '@use "./styles/variables" as *;'
$content = $content -replace '@import\s+"[^"]*mixins";', '@use "./styles/mixins" as *;'
Set-Content $stylesScss -Value $content -NoNewline

# Fix src/styles/_mixins.scss
$mixinsScss = "src/styles/_mixins.scss"
$content = Get-Content $mixinsScss -Raw
$content = $content -replace '@import\s+"[^"]*variables";', '@use "./variables" as *;'
Set-Content $mixinsScss -Value $content -NoNewline

Write-Host "Migrated $($scssFiles.Count + 2) SCSS files from @import to @use"
