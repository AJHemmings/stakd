# Smoke test for the /api/auth/welcome relay fix.
#
#   pwsh scripts/smoke-welcome.ps1                              # localhost
#   pwsh scripts/smoke-welcome.ps1 -BaseUrl https://stakdbars.com
#
# The endpoint deliberately returns an identical response whether or not it
# sent anything, so most assertions here are about that indistinguishability
# rather than about the send itself. Distinguishable responses would turn the
# fix into an email-enumeration oracle.
#
# Note the rate limiter is per-instance and in-memory. That is reliable against
# a single dev server; against production the counter may be spread over
# several instances, so the 429 case is only asserted on localhost.

param(
  [string]$BaseUrl = 'http://localhost:3000'
)

$ErrorActionPreference = 'Stop'

# Accounts confirmed present in auth.users and ~92 days old, so both are far
# outside the 10-minute signup window and must not receive mail.
$OldAccount     = 'adamhemmingsdev@gmail.com'
$OldUnconfirmed = 'admin@stakd.com'
$NoSuchAccount  = 'definitely-not-a-customer-9f3a@example.com'

$script:pass = 0
$script:fail = 0

function Report($ok, $name, $detail) {
  if ($ok) { $script:pass++; Write-Host "  PASS  $name" -ForegroundColor Green }
  else     { $script:fail++; Write-Host "  FAIL  $name" -ForegroundColor Red }
  if ($detail) { Write-Host "        $detail" -ForegroundColor DarkGray }
}

function Invoke-Welcome($body) {
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  $res = Invoke-WebRequest -Uri "$BaseUrl/api/auth/welcome" -Method POST `
    -ContentType 'application/json' -Body ($body | ConvertTo-Json -Depth 5) `
    -SkipHttpErrorCheck
  $sw.Stop()
  return @{ Status = $res.StatusCode; Body = $res.Content.Trim(); Ms = $sw.ElapsedMilliseconds }
}

Write-Host ""
Write-Host "Welcome-relay smoke test -> $BaseUrl" -ForegroundColor Cyan
Write-Host ("-" * 64)

# ---------------------------------------------------------------------------
Write-Host "`n[1] Malformed input is rejected before any lookup" -ForegroundColor Yellow
# These run ahead of the rate limiter, so they cost nothing against the quota.
$bad = @(
  @{ Name = 'missing email';    Body = @{} }
  @{ Name = 'empty email';      Body = @{ email = '' } }
  @{ Name = 'not an address';   Body = @{ email = 'nonsense' } }
  @{ Name = 'no TLD';           Body = @{ email = 'a@b' } }
  @{ Name = 'overlong address'; Body = @{ email = ('x' * 250 + '@example.com') } }
)
foreach ($c in $bad) {
  $r = Invoke-Welcome $c.Body
  Report ($r.Status -eq 400) $c.Name "expected 400, got $($r.Status)"
}

# ---------------------------------------------------------------------------
Write-Host "`n[2] The relay is closed, and closing it did not open an oracle" -ForegroundColor Yellow

$noAccount = Invoke-Welcome @{ email = $NoSuchAccount }
$oldAcct   = Invoke-Welcome @{ email = $OldAccount }

Report ($noAccount.Status -eq 200) `
  "arbitrary address gets a generic response" `
  "status=$($noAccount.Status) body=$($noAccount.Body)"

Report ($oldAcct.Status -eq 200) `
  "long-standing account gets the same generic response" `
  "status=$($oldAcct.Status) body=$($oldAcct.Body)"

Report (($noAccount.Status -eq $oldAcct.Status) -and ($noAccount.Body -eq $oldAcct.Body)) `
  "responses are indistinguishable (no account-existence oracle)" `
  "'$($noAccount.Body)' vs '$($oldAcct.Body)'"

# A Resend round-trip costs hundreds of ms. Both of these should return without
# one, so neither should look like a send. This is a signal, not a proof.
Report (($noAccount.Ms -lt 1500) -and ($oldAcct.Ms -lt 1500)) `
  "neither request shows send-shaped latency" `
  "no-account=$($noAccount.Ms)ms  old-account=$($oldAcct.Ms)ms"

# ---------------------------------------------------------------------------
if ($BaseUrl -match 'localhost|127\.0\.0\.1') {
  Write-Host "`n[3] Rate limiting (single instance only)" -ForegroundColor Yellow
  # Two valid requests already spent above; the limit is 5 per minute per IP.
  $statuses = @()
  for ($i = 0; $i -lt 6; $i++) {
    $statuses += (Invoke-Welcome @{ email = $OldUnconfirmed }).Status
  }
  Report ($statuses -contains 429) `
    "sustained requests eventually get 429" `
    ("sequence: " + ($statuses -join ', '))
} else {
  Write-Host "`n[3] Rate limiting - skipped (multi-instance; counter is per-instance)" -ForegroundColor DarkGray
}

# ---------------------------------------------------------------------------
Write-Host ""
Write-Host ("-" * 64)
if ($script:fail -eq 0) {
  Write-Host "$($script:pass) passed, 0 failed" -ForegroundColor Green
  exit 0
} else {
  Write-Host "$($script:pass) passed, $($script:fail) FAILED" -ForegroundColor Red
  exit 1
}
