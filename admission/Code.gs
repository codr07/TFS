
const CONFIG = {
  SHEET_NAME: 'TFS Admissions',
  SPREADSHEET_NAME: 'TFS — Student Admission Database',
  // Leave empty so setupTFS() creates and permanently stores a dedicated database.
  SPREADSHEET_ID: '',
  SPREADSHEET_PROPERTY_KEY: 'TFS_ADMISSION_SPREADSHEET_ID',
  PAYMENT_AMOUNT: 1000,
  UPI_ID: 'codr@slc',
  UPI_NAME: 'TFS - The Fretboard Society',
  SESSION_SECONDS: 300
};

const HEADERS = [
  'Timestamp', 'Admission ID', 'Payment Reference',
  'Payment Session Expiry', 'Payment Status',
  'UTR / Transaction ID', 'UPI Payer Name', 'Student Name',
  'Phone / WhatsApp', 'Email', 'Address', 'Profession',
  'Curriculum', 'Class Type', 'Add-ons', 'Schedule',
  'Admission Fee', 'Base Tuition Fee', 'Add-on Fee',
  'Total Monthly Fee', 'Total Payable Now', 'Payment Verified Date',
  'Notes'
];

const SUMMARY_SHEET_NAME = 'Admission Summary';

function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'database') {
    return ContentService
      .createTextOutput(JSON.stringify(setupTFS()))
      .setMimeType(ContentService.MimeType.JSON);
  }
  if (e && e.parameter && e.parameter.action === 'admissions') {
    const result = getAdmissions_();
    const callback = String(e.parameter.callback || '');
    if (callback && /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/.test(callback)) {
      return ContentService
        .createTextOutput(callback + '(' + JSON.stringify(result) + ');')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('TFS — Student Admission')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getAdmissions_() {
  const db = setupTFS();
  const ss = SpreadsheetApp.openById(db.spreadsheetId);
  const sh = ss.getSheetByName(CONFIG.SHEET_NAME);
  const lastRow = sh.getLastRow();
  if (lastRow < 2) {
    return { success: true, headers: HEADERS, rows: [], spreadsheetUrl: db.spreadsheetUrl };
  }

  const values = sh.getRange(1, 1, lastRow, HEADERS.length).getDisplayValues();
  return {
    success: true,
    headers: values[0],
    rows: values.slice(1).filter(function (row) {
      return row.some(function (cell) { return String(cell).trim(); });
    }),
    spreadsheetUrl: db.spreadsheetUrl
  };
}

function doPost(e) {
  try {
    setupTFS();
    const payload = e && e.parameter ? e.parameter : {};
    const required = [
      'name', 'phone', 'email', 'address', 'profession',
      'curriculum', 'classType', 'schedule', 'utr', 'payerName'
    ];
    required.forEach(function (field) {
      if (!String(payload[field] || '').trim()) {
        throw new Error('Missing required field: ' + field);
      }
    });

    const phone = String(payload.phone).trim();
    if (!/^[6-9]\d{9}$/.test(phone)) throw new Error('Invalid phone number.');
    if (String(payload.utr).trim().length < 6) throw new Error('Invalid UTR.');

    const addons = String(payload.addons || '').split(',')
      .map(function (item) { return item.trim(); })
      .filter(Boolean);
    const monthlyFeeAmount = calculateMonthlyFeeAmount_(payload.curriculum, payload.classType) +
      calculateAddonFee_(addons);
    const isFeePayment = String(payload.paymentType || '') === 'feePayment';
    const admissionFee = isFeePayment ? 0 : CONFIG.PAYMENT_AMOUNT;
    const paymentAmount = admissionFee + monthlyFeeAmount;
    const admissionId = 'TFS-' +
      Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd') +
      '-' + randomToken_(5);
    const db = setupTFS();
    const sh = SpreadsheetApp.openById(db.spreadsheetId).getSheetByName(CONFIG.SHEET_NAME);

    appendAdmissionRow_(sh, [
      new Date(), admissionId, String(payload.paymentReference || '').trim(), '',
      'PENDING VERIFICATION', String(payload.utr).trim(),
      String(payload.payerName).trim(), String(payload.name).trim(), phone,
      String(payload.email).trim(), String(payload.address).trim(),
      String(payload.profession).trim(), String(payload.curriculum).trim(),
      String(payload.classType).trim(), addons.join(', '),
      String(payload.schedule).trim(), admissionFee,
      calculateMonthlyFeeAmount_(payload.curriculum, payload.classType),
      calculateAddonFee_(addons), '', '', '',
      'Verify the Rs.' + paymentAmount + ' payment (' +
      (isFeePayment ? 'monthly fee payment' : 'Rs.' + CONFIG.PAYMENT_AMOUNT + ' admission + ') +
      'Rs.' + monthlyFeeAmount + ' plan).'
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, admissionId: admissionId }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message || String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Run this function manually ONCE from the Apps Script editor.
function setupTFS() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const props = PropertiesService.getScriptProperties();
    // Script Properties survive web-app executions and deployments. This prevents
    // a new spreadsheet from being created for every submission.
    let id = props.getProperty(CONFIG.SPREADSHEET_PROPERTY_KEY) ||
      CONFIG.SPREADSHEET_ID;
    let ss;

    if (id) {
      try {
        ss = SpreadsheetApp.openById(id);
      } catch (e) {
        props.deleteProperty(CONFIG.SPREADSHEET_PROPERTY_KEY);
        id = null;
      }
    }

    if (!id) {
      ss = SpreadsheetApp.create(CONFIG.SPREADSHEET_NAME);
      id = ss.getId();
      props.setProperty(CONFIG.SPREADSHEET_PROPERTY_KEY, id);
    }

    let sh = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sh) {
      sh = ss.insertSheet(CONFIG.SHEET_NAME);
    }

    ensureAdmissionSheet_(sh);
    ensureSummarySheet_(ss, sh);

    SpreadsheetApp.flush();

    const result = {
      success: true,
      spreadsheetId: id,
      spreadsheetUrl: ss.getUrl(),
      sheetName: CONFIG.SHEET_NAME
    };

    console.log(JSON.stringify(result));
    return result;
  } finally {
    lock.releaseLock();
  }
}

// Open the database directly from the web app.
function getDatabaseUrl() {
  return setupTFS().spreadsheetUrl;
}

// Run manually after deployment to create the database and print its URL.
function createPermanentAdmissionDatabase() {
  const result = setupTFS();
  Logger.log(result.spreadsheetUrl);
  return result;
}

function ensureAdmissionSheet_(sh) {
  if (sh.getMaxColumns() < HEADERS.length) {
    sh.insertColumnsAfter(sh.getMaxColumns(), HEADERS.length - sh.getMaxColumns());
  }

  const existingHeaders = sh.getLastColumn() >= 18
    ? sh.getRange(1, 1, 1, 18).getValues()[0]
    : [];
  const isLegacySchema = existingHeaders.length === 18 &&
    existingHeaders[0] === 'Timestamp' &&
    existingHeaders[16] === 'Total Monthly Fee';
  if (isLegacySchema && sh.getLastRow() > 1) {
    const legacyRows = sh.getRange(2, 1, sh.getLastRow() - 1, 18).getValues();
    const migratedRows = legacyRows.map(function (row) {
      const legacyMonthly = Number(String(row[16]).replace(/[^\d.-]/g, '')) || 0;
      return row.slice(0, 16).concat([
        CONFIG.PAYMENT_AMOUNT, legacyMonthly, 0, '', '', '', row[17]
      ]);
    });
    sh.getRange(2, 1, migratedRows.length, HEADERS.length)
      .clearContent()
      .setValues(migratedRows);
    sh.getRange(2, 20, migratedRows.length, 2)
      .setFormulasR1C1(migratedRows.map(function () {
        return ['=RC[-2]+RC[-1]', '=RC[-4]+RC[-1]'];
      }));
  }

  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, HEADERS.length)
    .setFontWeight('bold')
    .setBackground('#111111')
    .setFontColor('#d4af37')
    .setWrap(true);

  const widths = [
    145, 125, 145, 145, 145, 145, 145, 170, 125, 220, 260, 140,
    150, 180, 220, 180, 115, 125, 105, 125, 125, 145, 360
  ];
  widths.forEach(function (width, index) {
    sh.setColumnWidth(index + 1, width);
  });
  sh.getRange('Q:T').setNumberFormat('"Rs."#,##0');
  sh.getRange('U:U').setNumberFormat('dd-mmm-yyyy hh:mm');
  sh.getRange('A:A').setNumberFormat('dd-mmm-yyyy hh:mm');
  sh.getRange('D:D').setNumberFormat('dd-mmm-yyyy hh:mm');
  sh.getRange(1, 1, Math.max(sh.getLastRow(), 2), HEADERS.length)
    .setVerticalAlignment('middle');
}

function ensureSummarySheet_(ss, admissionsSheet) {
  let summary = ss.getSheetByName(SUMMARY_SHEET_NAME);
  if (!summary) summary = ss.insertSheet(SUMMARY_SHEET_NAME, 0);

  summary.clear();
  summary.getRange('A1:B1').merge()
    .setValue('TFS Admission Summary')
    .setBackground('#111111')
    .setFontColor('#d4af37')
    .setFontWeight('bold')
    .setFontSize(16);
  summary.getRange('A3:B9').setValues([
    ['Metric', 'Value'],
    ['Total applications', "=COUNTA('TFS Admissions'!B2:B)"],
    ['Pending verification', "=COUNTIF('TFS Admissions'!E2:E,\"PENDING VERIFICATION\")"],
    ['Verified payments', "=COUNTIF('TFS Admissions'!E2:E,\"VERIFIED\")"],
    ['Admission fees collected', "=SUMIF('TFS Admissions'!E2:E,\"VERIFIED\",'TFS Admissions'!Q2:Q)"],
    ['Monthly tuition value', "=SUM('TFS Admissions'!T2:T)"],
    ['Total payable value', "=SUM('TFS Admissions'!U2:U)"]
  ]);
  summary.getRange('A3:B3')
    .setBackground('#111111')
    .setFontColor('#d4af37')
    .setFontWeight('bold');
  summary.getRange('B7:B9').setNumberFormat('"Rs."#,##0');
  summary.setColumnWidth(1, 250);
  summary.setColumnWidth(2, 180);
  summary.setFrozenRows(3);
}

function appendAdmissionRow_(sh, values) {
  if (values.length !== HEADERS.length) {
    throw new Error('Admission row has ' + values.length +
      ' columns; expected ' + HEADERS.length + '.');
  }

  sh.appendRow(values);
  const row = sh.getLastRow();
  sh.getRange(row, 20, 1, 2).setFormulas([[
    '=R' + row + '+S' + row,
    '=Q' + row + '+T' + row
  ]]);
  sh.getRange(row, 17, 1, 5).setNumberFormat('"Rs."#,##0');
  sh.getRange(row, 1, 1, HEADERS.length).setWrap(true);
}

function createPaymentSession(monthlyFee) {
  setupTFS();

  const now = Date.now();
  const expires = now + CONFIG.SESSION_SECONDS * 1000;
  const selectedMonthlyFee = Math.max(0, Number(monthlyFee) || 0);
  const paymentAmount = CONFIG.PAYMENT_AMOUNT + selectedMonthlyFee;
  const ref = 'TFS' +
    Utilities.formatDate(
      new Date(now),
      Session.getScriptTimeZone(),
      'yyyyMMddHHmmss'
    ) + '-' + randomToken_(6);

  const sessionId = Utilities.getUuid();

  const upiUri = 'upi://pay' +
    '?pa=' + encodeURIComponent(CONFIG.UPI_ID) +
    '&pn=' + encodeURIComponent(CONFIG.UPI_NAME) +
    '&am=' + encodeURIComponent(paymentAmount.toFixed(2)) +
    '&cu=INR' +
    '&tr=' + encodeURIComponent(ref) +
    '&tn=' + encodeURIComponent('TFS Admission Fee - ' + ref);

  CacheService.getScriptCache().put(
    'PAYMENT_SESSION_' + sessionId,
    JSON.stringify({
      ref: ref,
      created: now,
      expires: expires,
      amount: paymentAmount,
      monthlyFee: selectedMonthlyFee
    }),
    CONFIG.SESSION_SECONDS
  );

  return {
    sessionId: sessionId,
    paymentReference: ref,
    upiId: CONFIG.UPI_ID,
    amount: paymentAmount,
    admissionFee: CONFIG.PAYMENT_AMOUNT,
    monthlyFee: selectedMonthlyFee,
    expiresAt: expires,
    qrText: upiUri
  };
}

// Called by the HTML form using google.script.run.
function submitAdmission(payload) {
  if (!payload) {
    throw new Error('No admission data was received.');
  }

  const required = [
    'name', 'phone', 'email', 'address', 'profession',
    'curriculum', 'classType', 'schedule', 'utr'
  ];

  required.forEach(function (field) {
    if (!String(payload[field] || '').trim()) {
      throw new Error('Please complete the required field: ' + field);
    }
  });

  const phone = String(payload.phone).trim();
  if (!/^[6-9]\d{9}$/.test(phone)) {
    throw new Error('Enter a valid 10-digit Indian mobile number.');
  }

  const utr = String(payload.utr).trim();
  if (utr.length < 6) {
    throw new Error('Enter a valid UPI transaction ID / UTR.');
  }

  if (!payload.paymentSessionId) {
    throw new Error('Payment session missing. Generate a new QR.');
  }

  const cache = CacheService.getScriptCache();
  const key = 'PAYMENT_SESSION_' + payload.paymentSessionId;
  const raw = cache.get(key);

  if (!raw) {
    throw new Error(
      'Payment QR session expired. Generate a new QR and try again.'
    );
  }

  const session = JSON.parse(raw);

  if (Date.now() > Number(session.expires)) {
    cache.remove(key);
    throw new Error('The 5-minute session expired. Generate a new QR.');
  }

  // Accept add-ons as either an array or comma-separated string.
  let addons = payload.addons || [];
  if (typeof addons === 'string') {
    addons = addons.split(',').map(function (item) {
      return item.trim();
    }).filter(Boolean);
  }
  if (!Array.isArray(addons)) addons = [];

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const db = setupTFS();
    const ss = SpreadsheetApp.openById(db.spreadsheetId);
    const sh = ss.getSheetByName(CONFIG.SHEET_NAME);

    const now = new Date();
    const admissionId = 'TFS-' +
      Utilities.formatDate(
        now, Session.getScriptTimeZone(), 'yyyyMMdd'
      ) + '-' + randomToken_(5);

    const monthlyFee = calculateMonthlyFee_(
      String(payload.curriculum),
      String(payload.classType),
      addons
    );
    const monthlyFeeAmount = calculateMonthlyFeeAmount_(
      String(payload.curriculum),
      String(payload.classType)
    ) + calculateAddonFee_(addons);
    const isFeePayment = String(payload.paymentType || '') === 'feePayment';
    const admissionFee = isFeePayment ? 0 : CONFIG.PAYMENT_AMOUNT;
    const paymentAmount = admissionFee + monthlyFeeAmount;

    appendAdmissionRow_(sh, [
      now,
      admissionId,
      session.ref,
      new Date(Number(session.expires)),
      'PENDING VERIFICATION',
      utr,
      String(payload.payerName || '').trim(),
      String(payload.name).trim(),
      phone,
      String(payload.email).trim(),
      String(payload.address).trim(),
      String(payload.profession).trim(),
      String(payload.curriculum).trim(),
      String(payload.classType).trim(),
      addons.join(', '),
      String(payload.schedule).trim(),
      admissionFee,
      calculateMonthlyFeeAmount_(
        String(payload.curriculum),
        String(payload.classType)
      ),
      calculateAddonFee_(addons),
      '',
      '',
      '',
      'Verify the Rs.' + paymentAmount +
      ' payment (' + (isFeePayment ? 'monthly fee payment' :
      'Rs.' + CONFIG.PAYMENT_AMOUNT + ' admission + ') + 'Rs.' +
      monthlyFeeAmount + ' plan) before confirming admission.'
    ]);

    SpreadsheetApp.flush();
    cache.remove(key);

    return {
      success: true,
      admissionId: admissionId,
      paymentReference: session.ref,
      status: 'PENDING VERIFICATION',
      spreadsheetUrl: db.spreadsheetUrl
    };
  } finally {
    lock.releaseLock();
  }
}

function calculateMonthlyFee_(curriculum, classType, addons) {
  let base = calculateMonthlyFeeAmount_(curriculum, classType);

  base += calculateAddonFee_(addons);

  return '₹' + base + '/month';
}

function calculateAddonFee_(addons) {
  let total = 0;
  addons.forEach(function (addon) {
    if (String(addon).indexOf('Song Writing') === 0) total += 500;
    if (String(addon).indexOf('Music Composing') === 0) total += 1500;
  });
  return total;
}

function calculateMonthlyFeeAmount_(curriculum, classType) {
  let base = 0;

  if (curriculum === 'Ukulele (Dotara)') {
    return classType.indexOf('Home Visit') === 0 ? 1500 : 0;
  }

  if (classType.indexOf('Home Visit') === 0) base = 1500;
  else if (classType.indexOf('Home Tuition') === 0) base = 1300;
  else if (classType.indexOf('Online') === 0) base = 900;

  return base;
}

function randomToken_(length) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const uuid = Utilities.getUuid().replace(/-/g, '').toUpperCase();
  let out = '';

  for (let i = 0; i < length; i++) {
    const byte = parseInt(uuid.substr(i * 2, 2), 16);
    out += chars.charAt(byte % chars.length);
  }

  return out;
}