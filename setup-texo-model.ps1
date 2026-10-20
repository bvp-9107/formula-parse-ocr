$ErrorActionPreference = 'Stop'
$projectRoot = Get-Location
$target = Join-Path $projectRoot 'public\models\model'
$tempRepo = Join-Path $env:TEMP 'formula-parse-texo-web-model'

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw 'Git is required for this one-time model setup. Install Git, reopen PowerShell, and run this script again.'
}
if (Test-Path $tempRepo) { Remove-Item $tempRepo -Recurse -Force }

Write-Host 'Downloading the official Texo-web model folder. This may take a little while...' -ForegroundColor Cyan
git clone --depth 1 --filter=blob:none --sparse https://github.com/alephpi/Texo-web.git $tempRepo
if ($LASTEXITCODE -ne 0) { throw 'Could not clone Texo-web. Check your internet connection and try again.' }
git -C $tempRepo sparse-checkout set models/model
if ($LASTEXITCODE -ne 0) { throw 'Could not select the Texo model folder from the repository.' }

$source = Join-Path $tempRepo 'models\model'
if (-not (Test-Path $source)) { throw 'The official repository did not contain models/model at the expected path.' }

if (Get-Command git-lfs -ErrorAction SilentlyContinue) {
  git -C $tempRepo lfs pull --include='models/model/*' 2>$null
}

$pointer = Get-ChildItem $source -Recurse -File | Where-Object {
  if ($_.Length -gt 512) { return $false }
  $head = Get-Content $_.FullName -TotalCount 1 -ErrorAction SilentlyContinue
  return $head -eq 'version https://git-lfs.github.com/spec/v1'
} | Select-Object -First 1
if ($pointer) { throw 'Texo model files are stored with Git LFS. Install Git LFS, run `git lfs install`, then run this script again.' }

if (Test-Path $target) { Remove-Item $target -Recurse -Force }
New-Item -ItemType Directory -Path (Split-Path $target -Parent) -Force | Out-Null
Copy-Item $source $target -Recurse -Force

Remove-Item $tempRepo -Recurse -Force
Write-Host "Texo model assets copied to $target" -ForegroundColor Green
Write-Host 'Restart the app and choose Texo in Recognition engine.' -ForegroundColor Green
