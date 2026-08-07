# Smoke test for the checkout security fix.
#
# Proves the server prices carts from the products table and ignores anything
# with money attached in the request body. Run against any environment:
#
#   pwsh scripts/smoke-checkout.ps1                              # production
#   pwsh scripts/smoke-checkout.ps1 -BaseUrl http://localhost:3000
#
# It creates real Stripe *test-mode* checkout sessions and reads them back from
# the Stripe API. The route returning 200 proves nothing about what Stripe was
# actually told, so every price assertion goes to Stripe, not to our response.

param(
  [string]$BaseUrl = 'https://stakdbars.com',
  [string]$EnvFile = "$PSScriptRoot/../.env.local"
)

$ErrorActionPreference = 'Stop'

# --- Fixtures. Update if the catalogue changes. ---
$RealProductId    = 'da99eaed-5438-4366-ac9a-d9567368fd6b'  # Peanut Butter Fudge...
$RealPricePence   = 1500                                     # products.price = 15.00
$MissingProductId = '00000000-0000-4000-8000-000000000000'   # valid UUID, no such row
$ExpiredVoucher   = 'MRKTSTRSUMM26'                          # expired 2026-07-30

# --- Load the Stripe key without ever printing it. ---
if (-not (Test-Path $EnvFile)) { throw "No env file at $EnvFile" }
$stripeKey = (Get-Content $EnvFile |
  Select-String -Pattern '^\s*STRIPE_SECRET_KEY\s*=\s*(.+)$' |
  Select-Object -First 1).Matches.Groups[1].Value.Trim().Trim('"').Trim("'")
if (-not $stripeKey) { throw "STRIPE_SECRET_KEY not found in $EnvFile" }
if (-not $stripeKey.StartsWith('sk_test_')) {
  throw "Refusing to run: key is not a test-mode key. This test creates real sessions."
}

$script:pass = 0
$script:fail = 0

function Report($ok, $name, $detail) {
  if ($ok) { $script:pass++; Write-Host "  PASS  $name" -ForegroundColor Green }
  else     { $script:fail++; Write-Host "  FAIL  $name" -ForegroundColor Red }
  if ($detail) { Write-Host "        $detail" -ForegroundColor DarkGray }
}

function Invoke-Checkout($body) {
  try {
    $res = Invoke-WebRequest -Uri "$BaseUrl/api/checkout" -Method POST `
      -ContentType 'application/json' -Body ($body | ConvertTo-Json -Depth 10) `
      -SkipHttpErrorCheck
    return @{ Status = $res.StatusCode; Body = ($res.Content | ConvertFrom-Json) }
  } catch {
    return @{ Status = -1; Body = @{ error = $_.Exception.Message } }
  }
}

# Asks Stripe what it was actually told, rather than trusting our own response.
function Get-StripeLineItems($sessionId) {
  $r = Invoke-RestMethod -Uri "https://api.stripe.com/v1/checkout/sessions/$sessionId/line_items?limit=100" `
    -Headers @{ Authorization = "Bearer $stripeKey" }
  return $r.data
}

Write-Host ""
Write-Host "Checkout smoke test -> $BaseUrl" -ForegroundColor Cyan
Write-Host ("-" * 60)

# ---------------------------------------------------------------------------
Write-Host "`n[1] Price forgery is ignored" -ForegroundColor Yellow
# The whole point of the fix. Claim a GBP15 bar costs 1p and check what Stripe charges.
$r = Invoke-Checkout @{
  items = @(@{
    productId = $RealProductId
    baseName  = 'Dark'
    quantity  = 1
    price     = 0.01          # the lie
    name      = 'Free Chocolate'
  })
  userEmail = 'attacker@example.com'   # must be ignored; identity is the cookie
}

if ($r.Status -ne 200) {
  Report $false "session created" "expected 200, got $($r.Status): $($r.Body.error)"
} else {
  $items = Get-StripeLineItems $r.Body.id
  $product = $items | Where-Object { $_.amount_total -gt 0 } | Select-Object -First 1
  $actual = $product.price.unit_amount
  Report ($actual -eq $RealPricePence) `
    "Stripe charged the database price, not the request price" `
    "unit_amount=$actual (expected $RealPricePence, request claimed 1)"
}

# ---------------------------------------------------------------------------
Write-Host "`n[2] Malformed carts are rejected" -ForegroundColor Yellow

$cases = @(
  @{ Name = 'non-UUID productId';        Body = @{ items = @(@{ productId = 'not-a-uuid'; quantity = 1 }) };                Expect = 400 }
  @{ Name = 'unknown product';           Body = @{ items = @(@{ productId = $MissingProductId; quantity = 1 }) };           Expect = 400 }
  @{ Name = 'fractional quantity';       Body = @{ items = @(@{ productId = $RealProductId; quantity = 1.5 }) };            Expect = 400 }
  @{ Name = 'zero quantity';             Body = @{ items = @(@{ productId = $RealProductId; quantity = 0 }) };              Expect = 400 }
  @{ Name = 'negative quantity';         Body = @{ items = @(@{ productId = $RealProductId; quantity = -5 }) };             Expect = 400 }
  @{ Name = 'quantity above cap';        Body = @{ items = @(@{ productId = $RealProductId; quantity = 1000 }) };           Expect = 400 }
  @{ Name = 'empty cart';                Body = @{ items = @() };                                                           Expect = 400 }
)

foreach ($c in $cases) {
  $res = Invoke-Checkout $c.Body
  Report ($res.Status -eq $c.Expect) $c.Name "expected $($c.Expect), got $($res.Status)"
}

# ---------------------------------------------------------------------------
Write-Host "`n[3] Voucher rules are enforced at checkout, not just in validate" -ForegroundColor Yellow

$res = Invoke-Checkout @{
  items = @(@{ productId = $RealProductId; baseName = 'Dark'; quantity = 1 })
  voucherCode = $ExpiredVoucher
}
Report ($res.Status -eq 400) `
  "expired voucher $ExpiredVoucher refused" `
  "expected 400, got $($res.Status) - $($res.Body.error)"

$res = Invoke-Checkout @{
  items = @(@{ productId = $RealProductId; baseName = 'Dark'; quantity = 1 })
  voucherCode = 'TOTALLY-MADE-UP-CODE'
}
Report ($res.Status -eq 400) "unknown voucher refused" "expected 400, got $($res.Status)"

# ---------------------------------------------------------------------------
Write-Host "`n[4] Rewards cannot be spent without owning them" -ForegroundColor Yellow
# No session cookie is sent, so this is the anonymous-attacker case.
$res = Invoke-Checkout @{
  items = @(@{ productId = $RealProductId; baseName = 'Dark'; quantity = 1 })
  rewardId = '11111111-1111-4111-8111-111111111111'
}
Report ($res.Status -eq 401) `
  "reward redemption without a session refused" `
  "expected 401, got $($res.Status) - $($res.Body.error)"

# ---------------------------------------------------------------------------
Write-Host ""
Write-Host ("-" * 60)
if ($script:fail -eq 0) {
  Write-Host "$($script:pass) passed, 0 failed" -ForegroundColor Green
  exit 0
} else {
  Write-Host "$($script:pass) passed, $($script:fail) FAILED" -ForegroundColor Red
  exit 1
}
