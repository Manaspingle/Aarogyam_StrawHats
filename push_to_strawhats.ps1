# ==============================================================================
# Aarogyam: Modular Feature-by-Feature Git Commit and Push Script
# Target Repository: https://github.com/Manaspingle/Aarogyam_StrawHats.git
# ==============================================================================

$ErrorActionPreference = "Stop"
$RepoUrl = "https://github.com/Manaspingle/Aarogyam_StrawHats.git"

Write-Host ">>> [1/4] Configuring Git remote and branch..." -ForegroundColor Cyan

# Ensure branch is main
git branch -M main

# Configure remote URL
$existingRemote = git remote get-url origin 2>$null
if ($existingRemote) {
    git remote set-url origin $RepoUrl
} else {
    git remote add origin $RepoUrl
}

Write-Host ">>> [2/4] Executing modular commits by feature..." -ForegroundColor Cyan

# Commit 1: Configuration & Toolchain
git add .gitignore package.json package-lock.json tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts tailwind.config.js postcss.config.js eslint.config.js vercel.json index.html
git commit -m "chore(setup): initialize project structure, Vite build toolchain, Tailwind configuration, and deployment rules"

# Commit 2: Branding Assets
git add public/favicon.svg public/aarogyam-logo.jpg
git commit -m "feat(branding): add official Aarogyam branding assets, logo, and vector favicon"

# Commit 3: TypeScript Models & Contracts
git add src/types/index.ts src/vite-env.d.ts
git commit -m "feat(types): define TypeScript models for donors, hospitals, emergency requests, casualties, and organ pledges"

# Commit 4: Core Medical Algorithms & Cryptography
git add src/lib/constants.ts src/lib/compatibility.ts src/lib/hash.ts src/lib/utils.ts src/lib/clsx-shim.ts
git commit -m "feat(lib/core): implement ABO/Rh medical compatibility matrix, SHA-256 cryptographic hashing, and utility helpers"

# Commit 5: Firebase Authentication & Firestore DB
git add src/lib/firebase.ts src/lib/firebaseDb.ts
git commit -m "feat(lib/firebase): configure Firebase client authentication, Firestore collections, and real-time listeners"

# Commit 6: Clinical Simulation Datasets & Knowledge Base
git add src/lib/mockData.ts src/lib/education.ts
git commit -m "feat(lib/data): initialize hospital triage datasets, verified ambulance fleets in MH, and organ education guides"

# Commit 7: Digital Certificate Engine
git add src/lib/certificateLogo.ts src/lib/certificateTemplate.ts
git commit -m "feat(lib/certificate): add digital pledge certificate canvas rendering and official watermark generator"

# Commit 8: State Management & Context Providers
git add src/context/ThemeContext.tsx src/context/LanguageContext.tsx src/context/AuthContext.tsx
git commit -m "feat(context): implement ThemeProvider (Dark/Light), LanguageProvider (EN/HI/MR), and RBAC AuthProvider"

# Commit 9: Global Styling & Application Entry
git add src/index.css src/main.tsx src/App.tsx
git commit -m "feat(core): setup global Tailwind styling, custom scrollbars, animations, and React Router application entry"

# Commit 10: Reusable UI Kit & Dashboard Layout Shell
git add src/components/ui.tsx src/components/Navbar.tsx src/components/Layout.tsx src/components/DashboardLayout.tsx
git commit -m "feat(components/layout): implement responsive navigation bar, multilingual headers, and dashboard layout shell"

# Commit 11: Emergency Accident Triage & GIS Incident Map
git add src/components/EmergencyAccidentModal.tsx src/components/InteractiveEmergencyMap.tsx src/components/AmbulanceDirectory.tsx
git commit -m "feat(emergency): implement multi-patient accident triage modal, interactive GIS map, and verified ambulance directory"

# Commit 12: Donor Tools & Gamified Lifesaver Rewards
git add src/components/DonorEligibilityCalculator.tsx src/components/RewardManagement.tsx
git commit -m "feat(components/donor): implement clinical donor eligibility calculator and gamified lifesaver reward management"

# Commit 13: Interactive Landing Page
git add src/pages/LandingPage.tsx
git commit -m "feat(landing): build interactive landing page with emergency SOS trigger, animated metrics, and doctor/donor showcase"

# Commit 14: Authentication & Onboarding Portal
git add src/pages/AuthPage.tsx
git commit -m "feat(auth): create unified onboarding portal with city-isolated hospital and individual donor authentication"

# Commit 15: Donor Portal & Gamified Dashboard
git add src/pages/DonorDashboard.tsx src/pages/IndividualDashboard.tsx
git commit -m "feat(dashboard/donor): build donor portal with donation tracking, digital card, and appointment scheduling"

# Commit 16: Hospital Command Center & Request Creator
git add src/pages/HospitalDashboard.tsx src/pages/CreateRequest.tsx
git commit -m "feat(dashboard/hospital): implement hospital control center with inventory tracking and emergency request creator"

# Commit 17: Administrative Governance Portal
git add src/pages/AdminDashboard.tsx
git commit -m "feat(dashboard/admin): implement administrative governance portal for facility verification and audit monitoring"

# Commit 18: Explainable AI Matching Engine
git add src/pages/MatchingEngine.tsx
git commit -m "feat(ai/matching): build explainable AI donor scoring engine evaluating distance, transit time, and antigen match"

# Commit 19: Emergency Dispatch & Cold-Chain Telemetry Tracker
git add src/pages/EmergencyDispatch.tsx
git commit -m "feat(dispatch): implement real-time emergency alert dispatch and temperature-monitored cold-chain telemetry"

# Commit 20: Posthumous Organ Pledge Registry
git add src/pages/OrganPledge.tsx
git commit -m "feat(registry): implement posthumous organ pledge registry with QR-verified digital donor pledge card"

# Commit 21: Verifiable Public Allocation Ledger
git add src/pages/TransparencyLog.tsx
git commit -m "feat(transparency): build verifiable public allocation ledger with cryptographic SHA-256 hash chaining"

# Commit 22: City Hospital Locator & Donor Directory
git add src/pages/NearbyHospitals.tsx src/pages/DonorDirectory.tsx
git commit -m "feat(network): build city-isolated hospital search, transfer network, and active donor directory"

# Commit 23: Clinical Analytics & Predictive AI Recommendations
git add src/pages/Reports.tsx src/pages/AIRecommendations.tsx
git commit -m "feat(analytics): implement blood/organ inventory analytics and AI predictive supply/demand recommendations"

# Commit 24: Project Documentation & Architecture
git add README.md .bolt/
git commit -m "docs: add comprehensive system architecture, emergency triage specifications, and developer documentation"

# Commit 25: Automated Commit & Push Scripts
git add push_commits.ps1 push_emergency_feature.ps1 push_feature_commits.ps1 push_to_strawhats.ps1
git commit -m "chore(ci/scripts): add modular PowerShell feature commit and push automation scripts for StrawHats repository"

Write-Host ">>> [3/4] Commit log generated successfully:" -ForegroundColor Green
git log --oneline

Write-Host ">>> [4/4] Pushing commits to GitHub ($RepoUrl)..." -ForegroundColor Cyan
git push -u origin main

Write-Host ">>> Done! All feature commits pushed successfully to $RepoUrl." -ForegroundColor Green
