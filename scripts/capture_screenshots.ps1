$ErrorActionPreference = "Stop"

if (-not (Test-Path "docs/screenshots")) {
    New-Item -ItemType Directory -Path "docs/screenshots" | Out-Null
}

$screens = @(
    @{ name = "01_login.png"; url = "http://localhost:3000/#login" },
    @{ name = "02_upload.png"; url = "http://localhost:3000/#upload" },
    @{ name = "03_extraction_with_source_highlight.png"; url = "http://localhost:3000/#verification" },
    @{ name = "04_review_screen.png"; url = "http://localhost:3000/#review" },
    @{ name = "05_summary.png"; url = "http://localhost:3000/#summary" },
    @{ name = "06_emergency_pdf.png"; url = "http://localhost:3000/#summary" },
    @{ name = "07_doctor_code_entry.png"; url = "http://localhost:3000/#doctor-access" },
    @{ name = "08_doctor_view.png"; url = "http://localhost:3000/#share" },
    @{ name = "09_ask_care.png"; url = "http://localhost:3000/#ask-ayu" },
    @{ name = "10_profile.png"; url = "http://localhost:3000/#account" }
)

foreach ($s in $screens) {
    $outPath = "docs/screenshots/$($s.name)"
    Write-Host "Capturing $($s.name)..."
    npx.cmd -y playwright screenshot --channel msedge --viewport-size "390, 844" --wait-for-timeout 1800 $($s.url) $outPath
}

Write-Host "All 10 mobile screenshots captured successfully in docs/screenshots/!"
