import { CERTIFICATE_LOGO_DATA_URI } from './certificateLogo';
import type { Certificate } from '@/types';

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function buildCertificateHtml(certificate: Certificate) {
  const donorName = certificate.donor_name || 'Donor';
  const date = formatDate(certificate.donation_date);
  const isOrgan = certificate.donation_type === 'organ_pledge';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${certificate.certificate_number} — Aarogyam Certificate</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Outfit:wght@400;600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: 'Outfit', Arial, sans-serif;
    background: #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 24px;
  }
  .certificate {
    position: relative;
    width: 1000px;
    max-width: 100%;
    background: #ffffff;
    overflow: hidden;
    border-radius: 16px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.15);
    padding: 64px 72px;
    border: 8px double #00605F;
  }
  .ribbon {
    position: absolute;
    width: 380px;
    height: 130px;
  }
  .ribbon-tl {
    top: -55px;
    left: -110px;
    transform: rotate(-45deg);
    background: linear-gradient(90deg, #00605F 0%, #00605F 30%, #ffffff 30%, #ffffff 34%, #F48552 34%, #F48552 100%);
  }
  .ribbon-br {
    bottom: -55px;
    right: -110px;
    transform: rotate(-45deg);
    background: linear-gradient(90deg, #F48552 0%, #F48552 66%, #ffffff 66%, #ffffff 70%, #00605F 70%, #00605F 100%);
  }
  .logo {
    position: absolute;
    top: 40px;
    right: 48px;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    object-fit: cover;
    box-shadow: 0 4px 14px rgba(0,0,0,0.15);
    border: 3px solid #00605F;
  }
  .content { position: relative; z-index: 2; text-align: center; }
  h1 {
    color: #00605F;
    font-weight: 900;
    font-size: 38px;
    letter-spacing: 1px;
    margin: 0 0 4px;
    text-transform: uppercase;
  }
  h2 {
    color: #F48552;
    font-weight: 700;
    font-size: 26px;
    letter-spacing: 4px;
    margin: 0 0 28px;
    text-transform: uppercase;
  }
  .awarded-to {
    font-size: 16px;
    color: #475569;
    margin-bottom: 8px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .donor-name {
    font-family: 'Great Vibes', cursive;
    font-size: 58px;
    color: #00605F;
    margin: 4px 0 6px;
  }
  .divider {
    width: 480px;
    max-width: 80%;
    height: 2px;
    background: #cbd5e1;
    margin: 0 auto 20px;
  }
  .description {
    font-size: 15px;
    line-height: 1.7;
    color: #334155;
    max-width: 760px;
    margin: 0 auto 36px;
  }
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: 24px;
    padding-top: 18px;
    border-top: 1px dashed #cbd5e1;
  }
  .sign-block {
    text-align: center;
    min-width: 180px;
  }
  .sign-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #64748b;
    margin-top: 4px;
  }
  .meta {
    font-size: 11px;
    color: #64748b;
    font-weight: 600;
    text-align: left;
  }
  .print-btn {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #00605F;
    color: #fff;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 100;
  }
  @media print {
    body { background: #fff; padding: 0; }
    .certificate { box-shadow: none; border-radius: 0; width: 100%; border: none; }
    .print-btn { display: none; }
  }
</style>
</head>
<body>
<button class="print-btn" onclick="window.print()">Print / Save PDF</button>
<div class="certificate">
  <div class="ribbon ribbon-tl"></div>
  <div class="ribbon ribbon-br"></div>
  <img src="${CERTIFICATE_LOGO_DATA_URI}" alt="Aarogyam Seal" class="logo" />
  
  <div class="content">
    <h1>Aarogyam Healthcare Network</h1>
    <h2>${isOrgan ? 'Organ Pledge of Honor' : 'Certificate of Donation'}</h2>
    
    <div class="awarded-to">This National Honor Is Proudly Presented To</div>
    <div class="donor-name">${donorName}</div>
    <div class="divider"></div>
    
    <div class="description">
      In sincere appreciation for your selfless dedication to human life. 
      ${isOrgan 
        ? `By pledging your organs <strong>(${certificate.organs?.join(', ') || 'Vital Organs'})</strong>, you stand as an eternal beacon of hope, saving up to 8 critically ill patients.` 
        : `Your verified blood donation of <strong>${certificate.units_collected || 1} Unit(s) (Blood Group: ${certificate.donor_blood_group || 'Verified'})</strong> on <strong>${date}</strong> at <strong>${certificate.hospital_name || 'Aarogyam Accredited Medical Center'}</strong> directly rescued lives in critical emergency.`
      }
    </div>
    
    <div class="footer">
      <div class="meta">
        <div><strong>Certificate ID:</strong> ${certificate.certificate_number}</div>
        <div><strong>Date of Issuance:</strong> ${date}</div>
        <div><strong>Accreditation:</strong> Directorate of Health Services, Maharashtra</div>
      </div>
      
      <div class="sign-block">
        <div style="font-family:'Great Vibes', cursive; font-size:30px; color:#00605F; line-height:1;">Dr. Pravin Kulkarni</div>
        <div class="sign-title">Chief Medical Director</div>
      </div>
      
      <div class="sign-block">
        <div style="font-family:'Great Vibes', cursive; font-size:30px; color:#F48552; line-height:1;">Aarogyam State Registry</div>
        <div class="sign-title">Medical Superintendent</div>
      </div>
    </div>
  </div>
</div>
</body>
</html>`;
}
