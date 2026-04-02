/**
 * Google Apps Script — append landing-page orders to a Google Sheet.
 *
 * Sheet tab: "Orders"
 * Columns: Date | Model | Quantity | Total (MAD) | Full name | City | Address | Phone | Form | Page URL
 *
 * 1) Create a Google Sheet. Copy its ID from the URL (.../d/SHEET_ID_HERE/edit).
 * 2) Paste SHEET_ID below (required if the script is NOT created from the Sheet menu).
 * 3) Replace SECRET_TOKEN below with a long random string.
 * 4) Deploy → New deployment → Web app → Execute as: Me → Who has access: Anyone.
 * 5) Copy the Web app URL into index.html: data-sheet-endpoint="..."
 * 6) Put the same token in index.html: data-sheet-token="..."
 */
var SHEET_NAME = "Orders";
/** Paste spreadsheet ID from https://docs.google.com/spreadsheets/d/THIS_PART/edit — leave "" only if script is bound via Sheet → Extensions → Apps Script */
var SPREADSHEET_ID = "";
var SECRET_TOKEN = "1df6fe69dc607f88fec71e6cbb1c4793aef13be5b5939bd7997e51d07d43cd8b725093acf25c45810d3bad6360904cca";

function doGet() {
  return jsonResponse_(200, { ok: true, message: "Order endpoint active. POST JSON to submit." });
}

function doPost(e) {
  try {
    var body = parseJsonBody_(e);
    if (!body) {
      return jsonResponse_(400, { ok: false, error: "INVALID_JSON" });
    }
    if (body.token !== SECRET_TOKEN) {
      return jsonResponse_(401, { ok: false, error: "UNAUTHORIZED" });
    }
    if (String(body.honeypot || "").trim()) {
      return jsonResponse_(200, { ok: true, skipped: true });
    }

    var model = cleanText_(body.model);
    var quantity = toPositiveInt_(body.quantity);
    var price = toPositiveInt_(body.price);
    var fullname = cleanText_(body.fullname);
    var city = cleanText_(body.city);
    var address = cleanText_(body.address);
    var phone = cleanPhone_(body.phone);
    var formId = cleanText_(body.form_id);
    var pageUrl = cleanText_(body.page_url);

    if (!model || !quantity || !price || !fullname || !city || !address || !phone) {
      return jsonResponse_(422, { ok: false, error: "MISSING_REQUIRED_FIELDS" });
    }

    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      var sheet = getOrCreateSheet_();
      sheet.appendRow([
        new Date(),
        model,
        quantity,
        price,
        fullname,
        city,
        address,
        phone,
        formId,
        pageUrl
      ]);
    } finally {
      lock.releaseLock();
    }

    return jsonResponse_(200, { ok: true });
  } catch (err) {
    return jsonResponse_(500, { ok: false, error: "SERVER_ERROR", detail: String(err) });
  }
}

function getSpreadsheet_() {
  if (SPREADSHEET_ID && String(SPREADSHEET_ID).trim()) {
    return SpreadsheetApp.openById(String(SPREADSHEET_ID).trim());
  }
  var bound = SpreadsheetApp.getActiveSpreadsheet();
  if (!bound) {
    throw new Error("No spreadsheet: set SPREADSHEET_ID in Code.gs or create this script from the Sheet (Extensions → Apps Script).");
  }
  return bound;
}

function getOrCreateSheet_() {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Date",
      "Model",
      "Quantity",
      "Total (MAD)",
      "Full name",
      "City",
      "Address",
      "Phone",
      "Form",
      "Page URL"
    ]);
  }
  return sheet;
}

function parseJsonBody_(e) {
  if (!e || !e.postData) {
    return null;
  }
  var raw = e.postData.contents;
  if (!raw || String(raw).trim() === "") {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (ex) {
    return null;
  }
}

function cleanText_(v) {
  return String(v || "").trim().replace(/\s+/g, " ");
}

function cleanPhone_(v) {
  var s = String(v || "").trim();
  if (!s) {
    return "";
  }
  return s.slice(0, 30);
}

function toPositiveInt_(v) {
  var n = parseInt(String(v), 10);
  if (isNaN(n) || n < 1) {
    return 0;
  }
  return n;
}

function jsonResponse_(code, obj) {
  var out = ContentService.createTextOutput(JSON.stringify(obj));
  out.setMimeType(ContentService.MimeType.JSON);
  return out;
}
