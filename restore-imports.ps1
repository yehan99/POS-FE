# Add @import statements back to all component SCSS files
$scssFiles = Get-ChildItem -Path "src/app" -Filter "*.scss" -Recurse

foreach ($file in $scssFiles) {
    $content = Get-Content $file.FullName -Raw

    # Skip if already has imports
    if ($content -match '@(use|import).*variables') {
        Write-Host "Skipping $($file.Name) - already has imports"
        continue
    }

    # Calculate relative path from file to styles folder
    $depth = ($file.FullName -replace [regex]::Escape((Get-Location).Path + "\src\app\"), "").Split("\").Length - 1
    $pathPrefix = ("../" * $depth) + "../styles/"

    # Add imports at the top
    $imports = "@import `"$($pathPrefix)variables`";`n@import `"$($pathPrefix)mixins`";`n`n"
    $content = $imports + $content

    Set-Content $file.FullName -Value $content -NoNewline
    Write-Host "Added imports to $($file.Name)"
}

Write-Host "`nProcessed $($scssFiles.Count) SCSS files"
