[CmdletBinding()]
param(
    [string]$CommitMessage = 'Update Koral Events',
    [ValidateSet('All', 'GitHub', 'Prod', 'Check')][string]$Target = 'All',
    [string]$SSHHost = 'root@vee-app.co.il'
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
function Run([string]$Command, [string[]]$Arguments) {
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Command failed ($LASTEXITCODE). Update stopped." }
}
Push-Location $PSScriptRoot
try {
    Run git @('diff', '--check')
    Run npm.cmd @('run', 'typecheck')
    Run npm.cmd @('test')
    if ($Target -eq 'Check') { return }
    $origin = (Run git @('remote', 'get-url', 'origin') | Out-String).Trim()
    if ($origin -ne 'https://github.com/lironatar1994-coder/KoralEvents.git') { throw 'Unexpected origin.' }
    if ((Run git @('branch', '--show-current') | Out-String).Trim() -ne 'main') { throw 'Switch to main before publishing.' }
    Run git @('fetch', 'origin')
    & git show-ref --verify --quiet refs/remotes/origin/main
    if ($LASTEXITCODE -eq 0) { Run git @('merge-base', '--is-ancestor', 'origin/main', 'HEAD') }
    if ($Target -eq 'Prod') {
        if (@(Run git @('status', '--porcelain')).Count) { throw 'Prod requires a clean working tree; use All to commit and push changes.' }
    } else {
        $paths = @('app','components','lib','public','scripts','tests','design','package.json','package-lock.json',
            'next.config.ts','next-env.d.ts','tsconfig.json','playwright.config.ts','README.md','AGENTS.md','CLAUDE.md',
            'ASSETS.md','VERIFICATION.md','Dockerfile','compose.yaml','Caddyfile','.dockerignore','.gitignore','.gitattributes','.env.example','deploy.ps1')
        $staged = @(Run git @('diff', '--cached', '--name-only'))
        foreach ($file in $staged) {
            if (-not @($paths | Where-Object { $file -eq $_ -or $file.StartsWith("$_/") }).Count) { throw "Unrelated staged file: $file" }
        }
        Run git (@('add', '--') + @($paths | Where-Object { Test-Path -LiteralPath $_ }))
        if (@(Run git @('diff', '--cached', '--name-only')).Count) { Run git @('commit', '-m', $CommitMessage) }
        Run git @('push', '-u', 'origin', 'HEAD:main')
    }
    $revision = (Run git @('rev-parse', 'HEAD') | Out-String).Trim()
    if ($revision -notmatch '^[0-9a-f]{40}$') { throw 'Invalid revision.' }
    if ($Target -eq 'GitHub') { return }
    $published = (Run git @('ls-remote', 'origin', 'refs/heads/main') | Out-String).Trim().Split()[0]
    if ($published -ne $revision) { throw 'GitHub main must match the exact deployment revision.' }
    if ($SSHHost -notmatch '^[A-Za-z0-9._-]+@[A-Za-z0-9.-]+$') { throw 'Invalid SSH host.' }
    New-Item -ItemType Directory -Force .deploy | Out-Null
    $archive = Join-Path $PSScriptRoot ".deploy/$revision.tar.gz"
    Run git @('archive', '--format=tar.gz', "--output=$archive", $revision)
    Run ssh @('-o','BatchMode=yes','-o','ConnectTimeout=15',$SSHHost,'install -d -m 700 /opt/koralevents/incoming')
    Run scp @('-o','BatchMode=yes',$archive,"${SSHHost}:/opt/koralevents/incoming/$revision.tar.gz")
    # The deployment code comes from the exact archive published to GitHub.
    Run ssh @('-o','BatchMode=yes',$SSHHost,"tar -xOf /opt/koralevents/incoming/$revision.tar.gz scripts/deploy-linux.sh | bash -s -- $revision")
    $health = Invoke-RestMethod 'https://lawebs.co.il/koralevents/api/health'
    if (-not $health.ok -or $health.revision -ne $revision) { throw 'Public health/revision verification failed.' }
    Write-Host "Live: https://lawebs.co.il/koralevents ($revision)" -ForegroundColor Green
} finally { Pop-Location }
