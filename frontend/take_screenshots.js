import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const screenshotsDir = path.resolve(__dirname, '..', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5174';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForContent(page, timeout = 7000) {
  await page.waitForFunction(() => {
    const text = document.body.innerText || '';
    const hasMemuat = text.includes('Memuat data') || text.includes('Memuat modul');
    return !hasMemuat;
  }, { timeout }).catch(() => {});
  await sleep(1200);
}

async function capture(page, filename, label) {
  console.log(`Capturing: ${label} -> ${filename}...`);
  await waitForContent(page);
  const targetPath = path.join(screenshotsDir, filename);
  await page.screenshot({
    path: targetPath,
    fullPage: false
  });
  console.log(`Saved ${filename}`);
}

async function loginUser(page, email, password, isDirector = false) {
  console.log(`Logging in as: ${email}...`);
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(1500);

  if (isDirector) {
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const dirBtn = buttons.find(b => b.textContent && b.textContent.includes('Direktur Utama'));
      if (dirBtn) dirBtn.click();
    });
    await sleep(600);
  }

  await page.waitForSelector('#login-email', { timeout: 10000 });
  await page.click('#login-email', { clickCount: 3 });
  await page.type('#login-email', email, { delay: 20 });

  await page.click('#login-password', { clickCount: 3 });
  await page.type('#login-password', password, { delay: 20 });

  // Click Remember Me so it saves to localStorage
  await page.evaluate(() => {
    const rememberText = Array.from(document.querySelectorAll('span')).find(s => s.textContent && s.textContent.includes('Tetap masuk'));
    if (rememberText) {
      const btn = rememberText.closest('button');
      if (btn) btn.click();
    }
  });

  await sleep(300);
  await page.click('#login-submit');

  // Wait until navigated away from login page
  await page.waitForFunction(() => window.location.pathname !== '/', { timeout: 15000 }).catch(() => {});
  await sleep(3000);

  // Sync token to both storages for reliability
  await page.evaluate(() => {
    const t = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
    const u = sessionStorage.getItem('auth_user') || localStorage.getItem('auth_user');
    if (t) {
      sessionStorage.setItem('auth_token', t);
      localStorage.setItem('auth_token', t);
    }
    if (u) {
      sessionStorage.setItem('auth_user', u);
      localStorage.setItem('auth_user', u);
    }
  });
}

async function main() {
  console.log('Starting screenshot capture...');
  console.log('Output directory:', screenshotsDir);

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    defaultViewport: {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1.5,
    },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });

  try {
    // ----------------------------------------------------
    // 1. PUBLIC / LOGIN PAGE
    // ----------------------------------------------------
    console.log('\n--- 1. Login & Public Pages ---');
    const publicContext = await browser.createBrowserContext();
    const publicPage = await publicContext.newPage();
    await publicPage.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });

    await publicPage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await sleep(2000);
    await capture(publicPage, '01_login_page.png', 'Halaman Login Multi-Perusahaan');

    await publicPage.goto(`${BASE_URL}/security-compliance`, { waitUntil: 'domcontentloaded' });
    await sleep(2000);
    await capture(publicPage, '14_kebijakan_keamanan_kepatuhan.png', 'Halaman Keamanan & Kepatuhan');
    await publicContext.close();

    // ----------------------------------------------------
    // 2. ADMIN PORTAL
    // ----------------------------------------------------
    console.log('\n--- 2. Admin Portal ---');
    const adminContext = await browser.createBrowserContext();
    const adminPage = await adminContext.newPage();
    await adminPage.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });

    await loginUser(adminPage, 'admin@absen.com', 'password', false);
    await capture(adminPage, '02_admin_dashboard_overview.png', 'Dashboard Overview Admin');

    await adminPage.goto(`${BASE_URL}/admin/rekapAbsensi`, { waitUntil: 'domcontentloaded' });
    await sleep(2000);
    await capture(adminPage, '03_admin_rekap_absensi.png', 'Rekap Absensi Karyawan');

    await adminPage.goto(`${BASE_URL}/admin/akunKaryawan`, { waitUntil: 'domcontentloaded' });
    await sleep(2000);
    await capture(adminPage, '04_admin_manajemen_karyawan.png', 'Kelola Master Data Karyawan');

    await adminPage.goto(`${BASE_URL}/admin/payroll`, { waitUntil: 'domcontentloaded' });
    await sleep(2000);
    await capture(adminPage, '05_admin_payroll_management.png', 'Manajemen Payroll & Gaji Digital');

    await adminPage.goto(`${BASE_URL}/admin/lokasiKantor`, { waitUntil: 'domcontentloaded' });
    await sleep(3500); // Wait for Leaflet map tiles
    await capture(adminPage, '06_admin_pengaturan_lokasi_kantor.png', 'Konfigurasi Lokasi & Radius GPS');

    await adminPage.goto(`${BASE_URL}/admin/shifts`, { waitUntil: 'domcontentloaded' });
    await sleep(2000);
    await capture(adminPage, '07_admin_kelola_shift_kerja.png', 'Kelola Shift Kerja Fleksibel');

    await adminPage.goto(`${BASE_URL}/admin/cuti`, { waitUntil: 'domcontentloaded' });
    await sleep(2000);
    await capture(adminPage, '08_admin_persetujuan_operasional_cuti.png', 'Persetujuan Operasional & Cuti');

    await adminPage.goto(`${BASE_URL}/admin/hariLibur`, { waitUntil: 'domcontentloaded' });
    await sleep(2000);
    await capture(adminPage, '09_admin_kelola_hari_libur.png', 'Kalender Hari Libur Nasional');

    await adminContext.close();

    // ----------------------------------------------------
    // 3. DIREKTUR PORTAL
    // ----------------------------------------------------
    console.log('\n--- 3. Direktur Portal ---');
    const dirContext = await browser.createBrowserContext();
    const dirPage = await dirContext.newPage();
    await dirPage.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });

    await loginUser(dirPage, 'melani.dian@cakrawala-internasional.co.id', 'password', true);
    await capture(dirPage, '10_direktur_dashboard_persetujuan.png', 'Dashboard Analitik Direktur');
    await dirContext.close();

    // ----------------------------------------------------
    // 4. EMPLOYEE PORTAL
    // ----------------------------------------------------
    console.log('\n--- 4. Employee Portal ---');
    const empContext = await browser.createBrowserContext();
    const empPage = await empContext.newPage();
    await empPage.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });

    await loginUser(empPage, 'msyaifulloh2024@gmail.com', 'password', false);
    await capture(empPage, '11_karyawan_dashboard_presensi.png', 'Portal Karyawan & Presensi Mandiri');

    await empPage.goto(`${BASE_URL}/employee/history`, { waitUntil: 'domcontentloaded' });
    await sleep(2000);
    await capture(empPage, '12_karyawan_riwayat_absensi.png', 'Riwayat Absensi Karyawan');

    await empPage.goto(`${BASE_URL}/employee/payroll`, { waitUntil: 'domcontentloaded' });
    await sleep(2000);
    await capture(empPage, '13_karyawan_slip_gaji.png', 'Slip Gaji Digital Karyawan');

    await empContext.close();

    console.log('\n=== ALL 14 SCREENSHOTS CAPTURED WITH FULL DATA! ===');
  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    await browser.close();
  }
}

main();
