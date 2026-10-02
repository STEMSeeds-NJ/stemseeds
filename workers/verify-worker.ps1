param(
  [Parameter(Mandatory = $true)]
  [string]$BaseUrl
)

$ErrorActionPreference = 'Stop'
$base = $BaseUrl.TrimEnd('/')

function Get-HeadersAndBody([string]$Path, [string]$Accept) {
  $headers = @{ Accept = $Accept }
  $response = Invoke-WebRequest -Uri "$base$Path" -Headers $headers -MaximumRedirection 5 -UseBasicParsing
  [pscustomobject]@{
    Status = [int]$response.StatusCode
    ContentType = [string]$response.Headers['Content-Type']
    Vary = [string]$response.Headers['Vary']
    Body = [string]$response.Content
  }
}

$markdownHome = Get-HeadersAndBody '/' 'text/markdown'
if ($markdownHome.Status -ne 200) { throw "Markdown homepage returned HTTP $($markdownHome.Status)." }
if ($markdownHome.ContentType -notmatch 'text/markdown') { throw "Markdown homepage Content-Type was '$($markdownHome.ContentType)'." }
if ($markdownHome.Vary -notmatch '(?i)(^|,\s*)Accept(\s*,|$)') { throw "Markdown homepage is missing Vary: Accept." }
if ([string]::IsNullOrWhiteSpace($markdownHome.Body)) { throw 'Markdown homepage body is empty.' }

$htmlHome = Get-HeadersAndBody '/' 'text/html'
if ($htmlHome.Status -ne 200) { throw "HTML homepage returned HTTP $($htmlHome.Status)." }
if ($htmlHome.ContentType -notmatch 'text/html') { throw "HTML homepage Content-Type was '$($htmlHome.ContentType)'." }

try {
  $notFound = Get-HeadersAndBody '/__ora-404-probe-agent' 'text/markdown'
} catch {
  $notFound = $_.Exception.Response
  $notFoundBody = (New-Object System.IO.StreamReader($notFound.GetResponseStream())).ReadToEnd()
  $notFound = [pscustomobject]@{
    Status = [int]$notFound.StatusCode
    ContentType = [string]$notFound.Headers['Content-Type']
    Vary = [string]$notFound.Headers['Vary']
    Body = $notFoundBody
  }
}
if ($notFound.Status -ne 404) { throw "Markdown 404 returned HTTP $($notFound.Status)." }
if ($notFound.ContentType -notmatch 'text/markdown') { throw "Markdown 404 Content-Type was '$($notFound.ContentType)'." }
if ($notFound.Body.Length -lt 20) { throw 'Markdown 404 body is shorter than 20 characters.' }

Write-Output "Worker verification passed for $base"
