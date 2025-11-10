# Use both variables and mixins explicitly
$scssFiles = Get-ChildItem -Path "src/app" -Filter "*.scss" -Recurse

foreach ($file in $scssFiles) {
    $content = Get-Content $file.FullName -Raw

    # Calculate relative path from file to styles folder
    $relativePath = $file.DirectoryName.Replace((Get-Location).Path + "\src\app", "").Split("\").Length - 1
    $pathPrefix = ("../" * $relativePath) + "../styles/"

    # Add both variables and mixins imports at the top
    $imports = "@use `"$($pathPrefix)variables`" as *;`n@use `"$($pathPrefix)mixins`" as *;`n"

    # Remove existing @use statements and add new ones
    $content = $content -replace '@use "[^"]*variables" as \*;\r?\n?', ''
    $content = $content -replace '@use "[^"]*mixins" as \*;\r?\n?', ''

    # Add imports at the very beginning
    $content = $imports + $content

    Set-Content $file.FullName -Value $content -NoNewline
}

Write-Host "Fixed @use statements in $($scssFiles.Count) SCSS files"
