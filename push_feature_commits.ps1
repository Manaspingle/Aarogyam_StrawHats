# ==============================================================================
# Aarogyam: Modular Feature-by-Feature Git Commit and Push Script
# Target Repository: https://github.com/Manaspingle/BuildX_027.git
# ==============================================================================

$ErrorActionPreference = "Stop"
$RepoUrl = "https://github.com/Manaspingle/BuildX_027.git"

Write-Host ">>> [1/4] Initializing clean Git repository on 'main' branch..." -ForegroundColor Cyan

if (Test-Path ".git") {
    Remove-Item -Path ".git" -Recurse -Force
}

git init -b main
git config user.name "ManasPingle"
git config user.email "manaspingle6174@gmail.com"
git remote add origin $RepoUrl

Write-Host ">>> [2/4] Executing modular commits by folder, file, and feature..." -ForegroundColor Cyan

# Commit 1: Configuration & Toolchain
git add .gitignore package.json package-lock.json tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts tailwind.config.js postcss.config.js eslint.config.js index.html
git commit -m "chore(setup): initialize project structure, toolchain configuration, and dependencies"

# Commit 2: Public Branding Assets
git add public/favicon.svg
git commit -m "feat(public): add application branding assets and vector favicon"

# Commit 3: Types & Models
git add src/types/index.ts src/vite-env.d.ts
git commit -m "feat(types): define TypeScript models for donors, hospitals, requests, and logs"

# Commit 4: Core Compatibility & Cryptographic Hasher
git add src/lib/constants.ts src/lib/compatibility.ts src/lib/hash.ts
git commit -m "feat(lib/core): add medical compatibility matrices, constants, and SHA-256 cryptographic hasher"

# Commit 5: Firebase Integration
git add src/lib/firebase.ts src/lib/firebaseDb.ts
git commit -m "feat(lib/firebase): configure Firebase client authentication and Firestore collections"

# Commit 6: Simulation Datasets & Educational Content
git add src/lib/mockData.ts src/lib/education.ts
git commit -m "feat(lib/data): add initial simulation datasets and educational knowledge base"

# Commit 7: Authentication Context & Session Management
git add src/context/AuthContext.tsx
git commit -m "feat(context): implement authentication provider with role-based access control and demo fallback"

# Commit 8: Global Styling & Application Entry
git add src/index.css src/main.tsx src/App.tsx
git commit -m "feat(core): setup global styling with Tailwind CSS and React Router application entry"

# Commit 9: Layout & Navigation Bar
git add src/components/Navbar.tsx src/components/Layout.tsx
git commit -m "feat(components): implement responsive navigation bar and dashboard layout shell"

# Commit 10: Landing Page
git add src/pages/LandingPage.tsx
git commit -m "feat(landing): build interactive landing page with animated metrics and live workflow presentation"

# Commit 11: Authentication & Onboarding Portal
git add src/pages/AuthPage.tsx
git commit -m "feat(auth): create unified portal for individual donor and verified hospital onboarding"

# Commit 12: Donor Dashboard & Retention Engine
git add src/pages/IndividualDashboard.tsx
git commit -m "feat(dashboard/donor): build individual donor portal with gamified lifesaver levels and milestones"

# Commit 13: Hospital Control Center & Request Creator
git add src/pages/HospitalDashboard.tsx src/pages/CreateRequest.tsx
git commit -m "feat(dashboard/hospital): implement hospital control center and emergency blood/organ request creator"

# Commit 14: Explainable AI Matching Engine
git add src/pages/MatchingEngine.tsx
git commit -m "feat(engine): implement multi-variable explainable AI donor scoring and matching engine"

# Commit 15: Emergency Dispatch & Cold-Chain Telemetry
git add src/pages/EmergencyDispatch.tsx
git commit -m "feat(dispatch): build real-time emergency alert dispatch and cold-chain telemetry tracking"

# Commit 16: Organ Pledge Registry & Certificate
git add src/pages/OrganPledge.tsx
git commit -m "feat(registry): implement posthumous organ pledge registry with digital certificate and QR verification"

# Commit 17: Verifiable Public Allocation Ledger
git add src/pages/TransparencyLog.tsx
git commit -m "feat(transparency): implement verifiable public allocation ledger with immutable hash verification"

# Commit 18: City Hospital Map & Donor Directory
git add src/pages/NearbyHospitals.tsx src/pages/DonorDirectory.tsx
git commit -m "feat(network): build city hospital geographic locator and active donor network directory"

# Commit 19: Allocation Analytics & Intelligence Engine
git add src/pages/Reports.tsx src/pages/AIRecommendations.tsx
git commit -m "feat(analytics): implement clinical allocation analytics and predictive demand insights engine"

# Commit 20: Documentation & Project Specs
git add README.md .bolt/
git commit -m "docs: add comprehensive architecture documentation, workflows, and developer guide"

Write-Host ">>> [3/4] Commit log generated successfully:" -ForegroundColor Green
git log --oneline

Write-Host ">>> [4/4] Pushing commits to GitHub ($RepoUrl)..." -ForegroundColor Cyan
git push -u origin main

Write-Host ">>> Done! All feature commits pushed successfully to $RepoUrl." -ForegroundColor Green
