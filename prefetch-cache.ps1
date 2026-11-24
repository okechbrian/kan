$ErrorActionPreference = "Continue"
$Proxy = "http://10.154.90.195:8080"
$Registry = "https://registry.npmjs.org"
$CacheBase = "$env:LOCALAPPDATA\npm-cache\_cacache"
$ProjectDir = $PSScriptRoot

Write-Host "=== npm cache pre-fetcher ===" -ForegroundColor Cyan

$pkg = Get-Content "$ProjectDir\package.json" | ConvertFrom-Json
$allDeps = @{}
if ($pkg.dependencies) { $pkg.dependencies.PSObject.Properties | ForEach-Object { $allDeps[$_.Name] = $_.Value } }
if ($pkg.devDependencies) { $pkg.devDependencies.PSObject.Properties | ForEach-Object { $allDeps[$_.Name] = $_.Value } }

Write-Host "Resolving $($allDeps.Count) dependencies via registry..." -ForegroundColor Green

$manifests = @{}

foreach ($dep in $allDeps.GetEnumerator()) {
    $name = $dep.Key
    $range = $dep.Value
    $encoded = $name -replace '/', '%2f'
    
    Write-Host -NoNewline "  $name@$range -> "
    
    $json = & curl.exe -s --proxy $Proxy --max-time 30 "$Registry/$encoded" 2>$null
    if (-not $json) { Write-Host "FAIL" -ForegroundColor Red; continue }
    
    $m = $json | ConvertFrom-Json
    $versions = $m.versions.PSObject.Properties.Name | Sort-Object { [version]($_ -replace '[^0-9.]', '') } -ErrorAction SilentlyContinue
    
    # Simple version resolution
    $clean = $range -replace '\^', '' -replace '~', '' -replace '>=', ''
    $target = $versions | Where-Object { $_ -eq $clean } | Select-Object -First 1
    if (-not $target) {
        $parts = $clean.Split('.')
        if ($parts.Count -ge 2) {
            $prefix = "$($parts[0]).$($parts[1])"
            $target = ($versions | Where-Object { $_ -like "$prefix.*" } | Select-Object -Last 1)
        }
    }
    if (-not $target -and $versions) { $target = $versions[-1] }
    
    if (-not $target -or -not $m.versions.$target) {
        Write-Host "no match" -ForegroundColor Red; continue
    }
    
    $vd = $m.versions.$target
    $integrity = $vd.dist.integrity
    $tarball = $vd.dist.tarball
    
    if (-not $integrity -or -not $tarball) {
        Write-Host "no tarball" -ForegroundColor Red; continue
    }
    
    Write-Host "$target " -NoNewline
    
    # Parse integrity hash: "sha512-<base64>"
    $parts2 = $integrity -split '-', 2
    $algo = $parts2[0]
    $hashB64 = $parts2[1]
    
    $contentDir = "$CacheBase\content-v2\$algo"
    $indexPath = "$CacheBase\index-v5\$algo"
    $contentFile = "$contentDir\$hashB64"
    
    if (Test-Path $contentFile) {
        Write-Host "CACHED" -ForegroundColor DarkGray
        continue
    }
    
    # Download tarball
    $tmpFile = "$env:TEMP\npm-cache-$($name.Replace('/','-'))-$target.tgz"
    & curl.exe -s -L --proxy $Proxy --max-time 300 -o $tmpFile $tarball 2>$null
    
    if (-not (Test-Path $tmpFile) -or (Get-Item $tmpFile).Length -eq 0) {
        Write-Host "download FAIL" -ForegroundColor Red
        continue
    }
    
    $size = (Get-Item $tmpFile).Length
    
    # Compute SHA512 hash to verify integrity
    $hasher = [System.Security.Cryptography.SHA512]::Create()
    $stream = [System.IO.File]::OpenRead($tmpFile)
    $hashBytes = $hasher.ComputeHash($stream)
    $stream.Close()
    $computedB64 = [Convert]::ToBase64String($hashBytes)
    
    if ($computedB64 -ne $hashB64) {
        Write-Host "hash mismatch ($($computedB64.Substring(0,20))...)" -ForegroundColor Yellow
        Remove-Item $tmpFile -Force -ErrorAction SilentlyContinue
        continue
    }
    
    # Store in cache
    if (-not (Test-Path $contentDir)) { New-Item -ItemType Directory -Path $contentDir -Force | Out-Null }
    if (-not (Test-Path $indexPath)) { New-Item -ItemType Directory -Path $indexPath -Force | Out-Null }
    
    Copy-Item $tmpFile $contentFile -Force
    
    # Write index entry
    $indexEntry = @{
        key = "make-fetch-happen:request-cache:$tarball"
        integrity = $integrity
        time = (Get-Date).ToUniversalTime().ToString("o")
        metadata = @{
            name = $vd.name
            version = $vd.version
        }
    } | ConvertTo-Json -Compress
    
    $indexFile = "$indexPath\$hashB64"
    [System.IO.File]::WriteAllText($indexFile, $indexEntry)
    
    Write-Host "OK ($([math]::Round($size/1KB))KB)" -ForegroundColor Green
    Remove-Item $tmpFile -Force -ErrorAction SilentlyContinue
}

Write-Host "`nDone! Now run: npm install --prefer-offline" -ForegroundColor Cyan
