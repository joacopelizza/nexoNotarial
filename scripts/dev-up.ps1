$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $repoRoot '.env'
$examplePath = Join-Path $repoRoot '.env.example'
$createdEnv = $false

function New-Secret([int] $byteCount = 32) {
  $bytes = [byte[]]::new($byteCount)
  $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $generator.GetBytes($bytes)
  } finally {
    $generator.Dispose()
  }
  return [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

if (-not (Test-Path -LiteralPath $envPath)) {
  if (-not (Test-Path -LiteralPath $examplePath)) {
    throw 'No se encontró .env.example en la raíz del proyecto.'
  }

  $envText = Get-Content -LiteralPath $examplePath -Raw
  $initialPassword = New-Secret 18
  $databasePassword = New-Secret
  $envText = $envText.Replace(
    'postgres://nexo:local-only-change-before-deploy@localhost:5432/nexo',
    "postgres://nexo:${databasePassword}@localhost:5432/nexo"
  )
  $envText = $envText.Replace('local-only-change-before-deploy', $databasePassword)
  $envText = $envText.Replace('replace-with-a-random-secret-at-least-32-characters', (New-Secret))
  $envText = $envText.Replace('replace-before-first-start', $initialPassword)
  [System.IO.File]::WriteAllText($envPath, $envText, [System.Text.UTF8Encoding]::new($false))
  $createdEnv = $true
}

Push-Location $repoRoot
try {
  if ($createdEnv) {
    Write-Host 'Se creó .env con claves locales aleatorias.'
    Write-Host "Usuario inicial: $(Select-String -Path $envPath -Pattern '^INITIAL_USERNAME=' | ForEach-Object { $_.Line.Split('=', 2)[1] })"
    Write-Host "Contraseña inicial: $initialPassword"
    Write-Host 'Guardá la contraseña; no se volverá a mostrar.'
  } else {
    Write-Host 'Se conserva el .env existente. Las credenciales están configuradas allí.'
  }

  docker compose up --build
  if ($LASTEXITCODE -ne 0) {
    throw "docker compose terminó con código $LASTEXITCODE."
  }
} finally {
  Pop-Location
}
