param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'
$requiredFiles = @(
  'index.html', 'forms.html', '404.html', 'robots.txt', 'sitemap.xml',
  'site.webmanifest', 'favicon.ico', 'favicon.svg', 'favicon-96x96.png',
  'apple-touch-icon.png', 'web-app-manifest-192x192.png',
  'web-app-manifest-512x512.png', 'logo.png',
  'assets/css/styles.css', 'assets/js/main.js'
)

foreach ($relativePath in $requiredFiles) {
  if (-not (Test-Path (Join-Path $Root $relativePath) -PathType Leaf)) {
    throw "Missing required asset: $relativePath"
  }
}

$manifest = Get-Content (Join-Path $Root 'site.webmanifest') -Raw | ConvertFrom-Json
foreach ($icon in $manifest.icons) {
  $iconPath = $icon.src.TrimStart('/')
  if (-not (Test-Path (Join-Path $Root $iconPath) -PathType Leaf)) {
    throw "Manifest icon does not exist: $($icon.src)"
  }
}

$htmlFiles = Get-ChildItem $Root -Filter '*.html' -File
foreach ($htmlFile in $htmlFiles) {
  $html = Get-Content $htmlFile.FullName -Raw
  foreach ($match in [regex]::Matches($html, '(?:src|href)="([^"]+)"')) {
    $reference = $match.Groups[1].Value
    if ($reference -match '^(https?:|mailto:|#|//|data:|/)') { continue }
    $path = $reference.Split('#')[0].Split('?')[0]
    if ([string]::IsNullOrWhiteSpace($path)) { continue }
    $candidate = Join-Path $htmlFile.DirectoryName $path
    if (-not (Test-Path $candidate -PathType Leaf)) {
      throw "Missing local reference in $($htmlFile.Name): $reference"
    }
  }
}

Write-Output "STEMSeeds static-site checks passed."
