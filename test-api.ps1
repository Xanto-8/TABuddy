$res = Invoke-WebRequest -Uri "http://localhost:3001/api/public-knowledge" -Method GET -UseBasicParsing
$content = $res.Content
$parsed = $content | ConvertFrom-Json
Write-Host "Status: $($res.StatusCode)"
Write-Host "Entries count: $($parsed.Count)"
Write-Host "First entry title: $($parsed[0].title)"
