#requires -Version 5.1
<#
BF-005: pruebas locales de cobertura con planes gratuitos.
No guarda tokens ni cotizaciones, solo un reporte de disponibilidad.
PowerShell: -NoProfile -ExecutionPolicy Bypass -File .\scripts\bf005-test-providers.ps1
#>
[CmdletBinding()]
param([ValidateSet("All","EODHD","TwelveData")][string]$Provider="All")
$ErrorActionPreference="Stop"
[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12
$funds=@(
    [pscustomobject]@{ticker="VWRA";isin="IE00BK5BQT80";exchange="LSE";market="LSE"},
    [pscustomobject]@{ticker="FWRA";isin="IE000716YHJ7";exchange="LSE";market="LSE"},
    [pscustomobject]@{ticker="VOO";isin="US9229083632";exchange="US";market="NYSE Arca"},
    [pscustomobject]@{ticker="VUG";isin="US9229087369";exchange="US";market="NYSE Arca"},
    [pscustomobject]@{ticker="SPYG";isin="US78464A4094";exchange="US";market="NYSE Arca"}
)
$end=[DateTime]::UtcNow.Date.ToString("yyyy-MM-dd")
$from350=[DateTime]::UtcNow.Date.AddDays(-350).ToString("yyyy-MM-dd")
$from30=[DateTime]::UtcNow.Date.AddDays(-30).ToString("yyyy-MM-dd")
$from24=[DateTime]::UtcNow.Date.AddMonths(-24).ToString("yyyy-MM-dd")
$reportRows=New-Object System.Collections.ArrayList

function Get-Secret([string]$name) {
    $secure=Read-Host -AsSecureString -Prompt "Introduce la API key de $name (no se mostrara)"
    if ($secure.Length -eq 0) { throw "No se introdujo una clave. Sin consultas." }
    $ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}
function Get-Value($o,[string]$name) {
    if ($null -eq $o) { return "" }
    $property=$o.PSObject.Properties[$name]
    if ($null -eq $property -or $null -eq $property.Value) { return "" }
    return [string]$property.Value
}
function Fetch-Safely([string]$url,[hashtable]$headers=@{}) {
    try {
        $value=Invoke-RestMethod -Uri $url -Method Get -Headers $headers -TimeoutSec 35 -ErrorAction Stop
        if ($null -ne $value -and (Get-Value $value "status") -eq "error") {
            $apiCode=Get-Value $value "code"
            return @{ok=$false;code=$apiCode;state="API_ERROR";body=$null}
        }
        return @{ok=$true;code=200;state="OK";body=$value}
    }
    catch {
        $status=0
        try { $status=[int]$_.Exception.Response.StatusCode } catch {}
        $state=switch ($status) {
            401 {"AUTH_FAILED"}
            402 {"PLAN_RESTRICTED"}
            403 {"PLAN_RESTRICTED"}
            404 {"NOT_FOUND"}
            429 {"RATE_LIMIT"}
            default {"HTTP_OR_NETWORK_ERROR"}
        }
        # Nunca escribir la excepcion completa: puede contener una URL con token.
        return @{ok=$false;code=$status;state=$state;body=$null}
    }
}
function New-Finding([string]$provider,$fund) {
    return [ordered]@{
        provider=$provider; ticker=$fund.ticker; expected_isin=$fund.isin
        target_market=$fund.market; target_currency="USD"
        metadata="NOT_TESTED";metadata_http=0
        reported_isin="";reported_exchange="";reported_currency="";plan_access=""
        history="NOT_TESTED";history_http=0;bars_30d=0;bars_350d=0;bars_24m=0
        first_date="";last_date="";series_currency="";series_exchange=""
        adjusted_method="NOT_VERIFIED";full_prices_exported=$false
    }
}
function Summarize-History($finding,$bars,[string]$dateKey) {
    $dates=@($bars | ForEach-Object { Get-Value $_ $dateKey } |
        Where-Object { $_ -match '^\d{4}-\d{2}-\d{2}' } |
        ForEach-Object { $_.Substring(0,10) } | Sort-Object)
    if ($dates.Count -eq 0) { $finding.history="NO_BARS";return }
    $finding.first_date=$dates[0]
    $finding.last_date=$dates[$dates.Count-1]
    $finding.bars_30d=@($dates|Where-Object{$_ -ge $from30}).Count
    $finding.bars_350d=@($dates|Where-Object{$_ -ge $from350}).Count
    $finding.bars_24m=@($dates|Where-Object{$_ -ge $from24}).Count
    $finding.history="BARS_RETURNED_IDENTITY_PENDING"
}

if ($Provider -in @("All","EODHD")) {
    Write-Host ""
    Write-Host "EODHD: 5 busquedas + hasta 5 consultas EOD, dentro del limite de 20/dia." -ForegroundColor Cyan
    $apiKey=Get-Secret "EODHD"
    try {
        foreach ($fund in $funds) {
            $x=New-Finding "EODHD" $fund
            $url="https://eodhd.com/api/search/$($fund.ticker)?api_token=$([uri]::EscapeDataString($apiKey))&fmt=json&type=etf&limit=50"
            $r=Fetch-Safely $url
            $x.metadata_http=$r.code
            if ($r.ok) {
                $matches=@($r.body|Where-Object {
                    (Get-Value $_ "Code") -ieq $fund.ticker -and
                    (Get-Value $_ "Exchange") -ieq $fund.exchange
                })
                $m=$matches|Where-Object{ (Get-Value $_ "Currency") -in @("","USD") }|Select-Object -First 1
                if ($null -eq $m) { $x.metadata="NO_EXACT_LISTING" }
                else {
                    $x.reported_isin=Get-Value $m "Isin"
                    $x.reported_exchange=Get-Value $m "Exchange"
                    $x.reported_currency=Get-Value $m "Currency"
                    if ($x.reported_isin -and $x.reported_isin -ine $fund.isin) { $x.metadata="ISIN_MISMATCH" }
                    elseif ($x.reported_isin -eq $fund.isin) { $x.metadata="ISIN_MATCH" }
                    else { $x.metadata="ISIN_NOT_RETURNED" }
                }
            } else {$x.metadata=$r.state}
            if ($x.metadata -notin @("ISIN_MISMATCH","AUTH_FAILED","PLAN_RESTRICTED","RATE_LIMIT")) {
                $url="https://eodhd.com/api/eod/$($fund.ticker).$($fund.exchange)?api_token=$([uri]::EscapeDataString($apiKey))&fmt=json&from=$from350&to=$end&period=d"
                $r=Fetch-Safely $url
                $x.history_http=$r.code
                if ($r.ok) {
                    Summarize-History $x @($r.body) "date"
                    $x.adjusted_method="EODHD_adjusted_close_not_validated"
                } else { $x.history=$r.state }
            } else { $x.history="SKIPPED" }
            [void]$reportRows.Add([pscustomobject]$x)
            Write-Host ("EODHD {0}: identidad={1}, datos={2}, dias={3}" -f $fund.ticker,$x.metadata,$x.history,$x.bars_350d)
            if ($x.history -eq "RATE_LIMIT" -or $x.metadata -eq "RATE_LIMIT") { break }
        }
    } finally { $apiKey=$null; $url=$null }
}

if ($Provider -in @("All","TwelveData")) {
    Write-Host ""
    Write-Host "Twelve Data: 5 fichas ETF + hasta 5 consultas historicas; pausas de 9 s." -ForegroundColor Cyan
    $apiKey=Get-Secret "Twelve Data"
    $headers=@{Authorization="apikey $apiKey"}
    try {
        foreach ($fund in $funds) {
            $x=New-Finding "TwelveData" $fund
            $url="https://api.twelvedata.com/etfs?symbol=$($fund.ticker)&show_plan=true"
            $r=Fetch-Safely $url $headers
            $x.metadata_http=$r.code
            if ($r.ok) {
                $matches=@($r.body.data|Where-Object{
                    (Get-Value $_ "symbol") -ieq $fund.ticker -and
                    (Get-Value $_ "currency") -ieq "USD"
                })
                if ($fund.exchange -eq "LSE") {
                    $m=$matches|Where-Object{
                        (Get-Value $_ "exchange") -match "London|LSE" -or
                        (Get-Value $_ "mic_code") -eq "XLON"
                    }|Select-Object -First 1
                } else {
                    $m=$matches|Where-Object{
                        (Get-Value $_ "exchange") -match "NYSE|Arca" -or
                        (Get-Value $_ "mic_code") -eq "ARCX"
                    }|Select-Object -First 1
                }
                if ($null -eq $m) {$x.metadata="NO_EXACT_LISTING"}
                else {
                    $x.reported_isin=Get-Value $m "isin"
                    $x.reported_exchange=Get-Value $m "exchange"
                    $x.reported_currency=Get-Value $m "currency"
                    if ($null -ne $m.access) {$x.plan_access=Get-Value $m.access "plan"}
                    if ($x.reported_isin -and $x.reported_isin -ine $fund.isin) {$x.metadata="ISIN_MISMATCH"}
                    elseif ($x.reported_isin -eq $fund.isin) {$x.metadata="ISIN_MATCH"}
                    else {$x.metadata="ISIN_NOT_RETURNED"}
                }
            } else {$x.metadata=$r.state}
            Start-Sleep -Seconds 9
            if ($x.metadata -notin @("ISIN_MISMATCH","AUTH_FAILED","PLAN_RESTRICTED","RATE_LIMIT")) {
                $url="https://api.twelvedata.com/time_series?symbol=$($fund.ticker)&interval=1day&start_date=$from24&end_date=$end&outputsize=800"
                if ($x.reported_exchange) {$url+="&exchange=$([uri]::EscapeDataString($x.reported_exchange))"}
                $r=Fetch-Safely $url $headers
                $x.history_http=$r.code
                if ($r.ok) {
                    Summarize-History $x @($r.body.values) "datetime"
                    $x.series_currency=Get-Value $r.body.meta "currency"
                    $x.series_exchange=Get-Value $r.body.meta "exchange"
                    if ($x.series_currency -and $x.series_currency -ne "USD") {$x.history="CURRENCY_MISMATCH"}
                    $x.adjusted_method="TD_default_adjustment_not_validated"
                } else {$x.history=$r.state}
            } else {$x.history="SKIPPED"}
            [void]$reportRows.Add([pscustomobject]$x)
            Write-Host ("Twelve {0}: identidad={1}, datos={2}, dias={3}" -f $fund.ticker,$x.metadata,$x.history,$x.bars_24m)
            Start-Sleep -Seconds 9
            if ($x.history -eq "RATE_LIMIT" -or $x.metadata -eq "RATE_LIMIT") { break }
        }
    } finally {$headers.Clear();$apiKey=$null;$url=$null}
}

$summary=[ordered]@{
    story="BF-005";generated_at_utc=[DateTime]::UtcNow.ToString("o")
    provider_selection=$Provider;contains_api_key=$false;contains_prices=$false
    notice="El resultado de cobertura NO certifica licencia ni rentabilidad total."
    findings=@($reportRows)
}
$dir=Join-Path ([Environment]::GetFolderPath("MyDocuments")) "BF005-Resultados"
if (-not (Test-Path -LiteralPath $dir)) {New-Item -ItemType Directory -Path $dir -Force|Out-Null}
$file=Join-Path $dir ("bf005-cobertura-{0}.json" -f (Get-Date -Format "yyyyMMdd-HHmmss"))
$summary|ConvertTo-Json -Depth 8|Set-Content -LiteralPath $file -Encoding UTF8
Write-Host ""
Write-Host "Reporte creado: $file" -ForegroundColor Green
Write-Host "Solo contiene metadatos. Revisa el JSON antes de compartirlo." -ForegroundColor Yellow
