$count = 0
$lineNum = 0
Get-Content "app/feedback/page.tsx" | ForEach-Object {
  $lineNum++
  $line = $_.Trim()
  # Count opening <div[ ...]> but NOT </div>
  $opens = [regex]::Matches($line, '<div\s[^>]*>|<div>') | ForEach-Object { $_.Value }
  $closes = [regex]::Matches($line, '</div>') | ForEach-Object { $_.Value }
  
  $hasOpen = $opens.Count -gt 0
  $hasClose = $closes.Count -gt 0
  
  if ($hasOpen -and -not $hasClose) {
    $count++
    if ($lineNum -ge 340) {
      Write-Output "OPEN  line $lineNum (count=$count): $line"
    }
  } elseif ($hasClose -and -not $hasOpen) {
    $count--
    if ($lineNum -ge 340) {
      Write-Output "CLOSE line $lineNum (count=$count): $line"
    }
  } elseif ($hasOpen -and $hasClose) {
    # Both on same line
    $netChange = $opens.Count - $closes.Count
    $count += $netChange
    if ($lineNum -ge 340) {
      Write-Output "BOTH  line $lineNum (count=$count, net=$netChange): $line"
    }
  }
}
Write-Output "Final nesting count: $count"
