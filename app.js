(() => {
  "use strict";

  // =========================================================================
  // Constants & Storage Keys
  // =========================================================================
  const STORAGE_KEYS = {
    API_URL: "API_URL",
    API_TOKEN: "API_TOKEN",
    BUDGET_MENSILE: "BUDGET_MENSILE",
    RESET_DAY: "RESET_DAY",
    TRANSACTIONS_CACHE: "BUDGET_TRANSACTIONS_CACHE",
    LAST_SYNC: "BUDGET_LAST_SYNC",
    LOCAL_MODE: "BUDGET_LOCAL_MODE"
  };

  const DEFAULT_RESET_DAY = 10;
  const RING_RADIUS = 112;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS; // ~703.7168

  const CATEGORIES = [
    {
      id: "Cibo",
      label: "Cibo",
      color: "#FF9F0A",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>`
    },
    {
      id: "Spesa",
      label: "Spesa",
      color: "#30D158",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`
    },
    {
      id: "Trasporti",
      label: "Trasporti",
      color: "#0A84FF",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`
    },
    {
      id: "Casa",
      label: "Casa",
      color: "#64D2FF",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"/><path d="M9 21v-6h6v6"/></svg>`
    },
    {
      id: "Svago",
      label: "Svago",
      color: "#FF375F",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
    },
    {
      id: "Salute",
      label: "Salute",
      color: "#FF453A",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`
    },
    {
      id: "Shopping",
      label: "Shopping",
      color: "#FFD60A",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`
    },
    {
      id: "Altro",
      label: "Altro",
      color: "#8E8E93",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>`
    }
  ];

  const TRASH_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;

  // =========================================================================
  // Application State
  // =========================================================================
  const state = {
    config: {
      apiUrl: "",
      apiToken: "",
      monthlyBudget: 600,
      resetDay: DEFAULT_RESET_DAY,
      localMode: false
    },
    transactions: [],
    lastSync: null,
    isSyncing: false,
    pendingDeleteTx: null,
    toastTimer: null
  };

  // =========================================================================
  // DOM References
  // =========================================================================
  const dom = {
    monthTitle: document.getElementById("month-title"),
    syncDot: document.getElementById("sync-dot"),
    syncStatusText: document.getElementById("sync-status-text"),
    btnRefresh: document.getElementById("btn-refresh"),
    btnSettings: document.getElementById("btn-settings"),
    btnAddExpense: document.getElementById("btn-add-expense"),

    ptrIndicator: document.getElementById("ptr-indicator"),
    ptrSpinner: document.getElementById("ptr-spinner"),
    ptrLabel: document.getElementById("ptr-label"),

    ringContainer: document.getElementById("ring-container"),
    ringProgress: document.getElementById("ring-progress"),
    ringStatusLabel: document.getElementById("ring-status-label"),
    todayAvailable: document.getElementById("today-available"),
    ringSublabel: document.getElementById("ring-sublabel"),
    todaySpentLabel: document.getElementById("today-spent-label"),

    metricDailyQuota: document.getElementById("metric-daily-quota"),
    metricRolloverDelta: document.getElementById("metric-rollover-delta"),
    metricBaseQuota: document.getElementById("metric-base-quota"),
    metricBaseDetail: document.getElementById("metric-base-detail"),
    metricMonthSpent: document.getElementById("metric-month-spent"),
    metricMonthSpentPct: document.getElementById("metric-month-spent-pct"),
    metricMonthRemaining: document.getElementById("metric-month-remaining"),
    metricDaysRemaining: document.getElementById("metric-days-remaining"),

    monthProgressFill: document.getElementById("month-progress-fill"),
    monthProgressTodayMarker: document.getElementById("month-progress-today-marker"),
    monthProgressLeft: document.getElementById("month-progress-left"),
    monthProgressRight: document.getElementById("month-progress-right"),

    transactionsCount: document.getElementById("transactions-count"),
    transactionsContainer: document.getElementById("transactions-container"),

    toast: document.getElementById("toast"),

    // Add Expense Modal
    modalAdd: document.getElementById("modal-add"),
    formAdd: document.getElementById("form-add-expense"),
    btnCancelAdd: document.getElementById("btn-cancel-add"),
    inputAmount: document.getElementById("input-amount"),
    inputMerchant: document.getElementById("input-merchant"),
    inputCategory: document.getElementById("input-category"),
    categoryGrid: document.getElementById("category-grid"),
    btnSubmitAdd: document.getElementById("btn-submit-add"),

    // Settings Modal
    modalSettings: document.getElementById("modal-settings"),
    formSettings: document.getElementById("form-settings"),
    btnCancelSettings: document.getElementById("btn-cancel-settings"),
    inputBudget: document.getElementById("input-budget"),
    inputResetDay: document.getElementById("input-reset-day"),
    inputApiUrl: document.getElementById("input-api-url"),
    inputApiToken: document.getElementById("input-api-token"),
    btnToggleToken: document.getElementById("btn-toggle-token"),
    btnLocalMode: document.getElementById("btn-local-mode"),
    btnClearCache: document.getElementById("btn-clear-cache"),

    // Delete Action Sheet
    modalDelete: document.getElementById("modal-delete"),
    deleteSheetTitle: document.getElementById("delete-sheet-title"),
    deleteSheetDesc: document.getElementById("delete-sheet-desc"),
    btnConfirmDelete: document.getElementById("btn-confirm-delete"),
    btnCancelDelete: document.getElementById("btn-cancel-delete")
  };

  // =========================================================================
  // Formatting & Parsing Helpers
  // =========================================================================
  const euroFormatter = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const euroCompactFormatter = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  function formatEuro(value, compact = false) {
    const safe = Number.isFinite(value) ? value : 0;
    const normalized = Math.abs(safe) < 0.005 ? 0 : safe;
    return (compact ? euroCompactFormatter : euroFormatter).format(normalized);
  }

  function formatSignedEuro(value) {
    const safe = Number.isFinite(value) ? value : 0;
    if (Math.abs(safe) < 0.005) return "€ 0,00";
    const prefix = safe > 0 ? "+" : "-";
    return `${prefix}${euroFormatter.format(Math.abs(safe))}`;
  }

  function parseEuroInput(raw) {
    if (typeof raw === "number") {
      return Number.isFinite(raw) ? raw : NaN;
    }
    if (typeof raw !== "string") return NaN;
    let cleaned = raw.trim().replace(/[€\s]/g, "");
    if (!cleaned) return NaN;

    // Handle both Italian (1.234,56) and standard (1234.56) formats
    if (cleaned.includes(",") && cleaned.includes(".")) {
      if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
        cleaned = cleaned.replace(/\./g, "").replace(",", ".");
      } else {
        cleaned = cleaned.replace(/,/g, "");
      }
    } else if (cleaned.includes(",")) {
      cleaned = cleaned.replace(",", ".");
    }
    const num = Number.parseFloat(cleaned);
    return Number.isFinite(num) ? num : NaN;
  }

  function parseTransactionDate(raw) {
    if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
      return raw.toISOString();
    }
    if (typeof raw === "number" && Number.isFinite(raw)) {
      const d = new Date(raw);
      return Number.isNaN(d.getTime()) ? null : d.toISOString();
    }
    if (typeof raw !== "string" || !raw.trim()) return null;

    const str = raw.trim();

    // Handle DD/MM/YYYY or DD/MM/YYYY HH:mm
    const itMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
    if (itMatch) {
      const [, dd, mm, yyyy, hh = "12", min = "0", ss = "0"] = itMatch;
      const d = new Date(
        Number(yyyy),
        Number(mm) - 1,
        Number(dd),
        Number(hh),
        Number(min),
        Number(ss)
      );
      return Number.isNaN(d.getTime()) ? null : d.toISOString();
    }

    // Handle date-only YYYY-MM-DD in local timezone to avoid UTC off-by-one day shift
    const ymdMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (ymdMatch) {
      const [, yyyy, mm, dd] = ymdMatch;
      const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd), 12, 0, 0);
      return Number.isNaN(d.getTime()) ? null : d.toISOString();
    }

    const parsed = new Date(str);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  function normalizeTransaction(raw, index = 0) {
    if (!raw || typeof raw !== "object") return null;

    const rawAmount =
      raw.amount ?? raw.importo ?? raw.Amount ?? raw.Importo ?? raw.value ?? raw.spesa;
    const parsedAmount = parseEuroInput(rawAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount === 0) return null;

    const rawDate =
      raw.date ?? raw.data ?? raw.Date ?? raw.Data ?? raw.timestamp ?? raw.Timestamp ?? raw.createdAt;
    const isoDate = parseTransactionDate(rawDate);
    if (!isoDate) return null;

    const merchant = String(
      raw.merchant ??
        raw.esercente ??
        raw.Merchant ??
        raw.Esercente ??
        raw.description ??
        raw.descrizione ??
        raw.name ??
        raw.note ??
        "Spesa"
    ).trim() || "Spesa";

    const category = String(
      raw.category ?? raw.categoria ?? raw.Category ?? raw.Categoria ?? "Altro"
    ).trim() || "Altro";

    const rawId = raw.id ?? raw.ID ?? raw.Id ?? raw.rowId ?? raw.uuid;
    const id =
      rawId !== undefined && rawId !== null && String(rawId).trim() !== ""
        ? String(rawId).trim()
        : `tx_${isoDate}_${index}_${Math.abs(parsedAmount)}`;

    return {
      id,
      amount: Math.round(Math.abs(parsedAmount) * 100) / 100,
      merchant,
      category,
      date: isoDate,
      _pending: Boolean(raw._pending)
    };
  }

  function getCategoryInfo(categoryName) {
    const normalized = String(categoryName || "").trim().toLowerCase();
    const found = CATEGORIES.find(
      (cat) => cat.id.toLowerCase() === normalized || cat.label.toLowerCase() === normalized
    );
    return found || CATEGORIES[CATEGORIES.length - 1];
  }

  function getLocalDateKey(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function formatDayGroupLabel(dateObj, now) {
    const todayKey = getLocalDateKey(now);
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const yesterdayKey = getLocalDateKey(yesterday);
    const targetKey = getLocalDateKey(dateObj);

    if (targetKey === todayKey) return "Oggi";
    if (targetKey === yesterdayKey) return "Ieri";

    return new Intl.DateTimeFormat("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "short"
    }).format(dateObj);
  }

  function formatTime(dateObj) {
    return new Intl.DateTimeFormat("it-IT", {
      hour: "2-digit",
      minute: "2-digit"
    }).format(dateObj);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // =========================================================================
  // Persistence (localStorage)
  // =========================================================================
  function sanitizeResetDay(raw) {
    const parsed = Number.parseInt(String(raw ?? ""), 10);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 28) {
      return DEFAULT_RESET_DAY;
    }
    return parsed;
  }

  function loadFromStorage() {
    const apiUrl = (localStorage.getItem(STORAGE_KEYS.API_URL) || "").trim();
    const apiToken = (localStorage.getItem(STORAGE_KEYS.API_TOKEN) || "").trim();
    const rawBudget = localStorage.getItem(STORAGE_KEYS.BUDGET_MENSILE);
    const parsedBudget = parseEuroInput(rawBudget);
    const resetDay = sanitizeResetDay(localStorage.getItem(STORAGE_KEYS.RESET_DAY));
    const localMode = localStorage.getItem(STORAGE_KEYS.LOCAL_MODE) === "1";

    state.config = {
      apiUrl,
      apiToken,
      monthlyBudget: Number.isFinite(parsedBudget) && parsedBudget > 0 ? parsedBudget : 600,
      resetDay,
      localMode
    };

    try {
      const cachedRaw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS_CACHE);
      if (cachedRaw) {
        const parsed = JSON.parse(cachedRaw);
        if (Array.isArray(parsed)) {
          state.transactions = parsed
            .map((item, idx) => normalizeTransaction(item, idx))
            .filter(Boolean);
        }
      }
    } catch {
      state.transactions = [];
    }

    const lastSyncRaw = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    state.lastSync = lastSyncRaw ? new Date(lastSyncRaw) : null;
  }

  function saveConfigToStorage() {
    localStorage.setItem(STORAGE_KEYS.API_URL, state.config.apiUrl);
    localStorage.setItem(STORAGE_KEYS.API_TOKEN, state.config.apiToken);
    localStorage.setItem(STORAGE_KEYS.BUDGET_MENSILE, String(state.config.monthlyBudget));
    localStorage.setItem(STORAGE_KEYS.RESET_DAY, String(sanitizeResetDay(state.config.resetDay)));
    if (state.config.localMode) {
      localStorage.setItem(STORAGE_KEYS.LOCAL_MODE, "1");
    } else {
      localStorage.removeItem(STORAGE_KEYS.LOCAL_MODE);
    }
  }

  function saveTransactionsCache() {
    try {
      const clean = state.transactions.map(({ _pending, ...tx }) => tx);
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS_CACHE, JSON.stringify(clean));
    } catch {
      // Ignore quota errors gracefully
    }
  }

  function saveLastSync(dateObj) {
    state.lastSync = dateObj;
    if (dateObj) {
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, dateObj.toISOString());
    } else {
      localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
    }
  }

  function isApiConfigured() {
    return Boolean(state.config.apiUrl && state.config.apiToken);
  }

  function isFirstRun() {
    const hasBudget = localStorage.getItem(STORAGE_KEYS.BUDGET_MENSILE) !== null;
    return !hasBudget && !isApiConfigured() && !state.config.localMode;
  }

  // =========================================================================
  // Core Dynamic Daily Budget Calculation (Rollover — Cycle from Reset Day)
  // =========================================================================
  function diffCalendarDays(startDate, endDate) {
    const utcStart = Date.UTC(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate()
    );
    const utcEnd = Date.UTC(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate()
    );
    return Math.round((utcEnd - utcStart) / 86_400_000);
  }

  function getCycleBounds(now, resetDay = DEFAULT_RESET_DAY) {
    const safeDay = sanitizeResetDay(resetDay);
    const year = now.getFullYear();
    const month = now.getMonth();
    const todayDate = now.getDate();

    // Cycle runs from resetDay of month M (00:00) up to resetDay of month M+1 (00:00, exclusive)
    let cycleStart;
    let nextReset;

    if (todayDate >= safeDay) {
      cycleStart = new Date(year, month, safeDay, 0, 0, 0, 0);
      nextReset = new Date(year, month + 1, safeDay, 0, 0, 0, 0);
    } else {
      cycleStart = new Date(year, month - 1, safeDay, 0, 0, 0, 0);
      nextReset = new Date(year, month, safeDay, 0, 0, 0, 0);
    }

    const cycleEndInclusive = new Date(
      nextReset.getFullYear(),
      nextReset.getMonth(),
      nextReset.getDate() - 1,
      23,
      59,
      59,
      999
    );

    const todayStart = new Date(year, month, todayDate, 0, 0, 0, 0);
    const tomorrowStart = new Date(year, month, todayDate + 1, 0, 0, 0, 0);

    const totalDaysInCycle = Math.max(1, diffCalendarDays(cycleStart, nextReset));
    const currentCycleDay = Math.max(1, diffCalendarDays(cycleStart, todayStart) + 1);
    const daysRemaining = Math.max(1, diffCalendarDays(todayStart, nextReset));

    return {
      resetDay: safeDay,
      cycleStart,
      nextReset,
      cycleEndInclusive,
      todayStart,
      tomorrowStart,
      totalDaysInCycle,
      currentCycleDay,
      daysRemaining
    };
  }

  function calculateBudgetMetrics(
    transactions,
    monthlyBudget,
    now = new Date(),
    resetDay = DEFAULT_RESET_DAY
  ) {
    const bounds = getCycleBounds(now, resetDay);
    const cycleStartMs = bounds.cycleStart.getTime();
    const nextResetMs = bounds.nextReset.getTime();
    const todayStartMs = bounds.todayStart.getTime();
    const tomorrowStartMs = bounds.tomorrowStart.getTime();

    const cycleTransactions = transactions
      .filter((tx) => {
        const d = new Date(tx.date);
        const ms = d.getTime();
        return !Number.isNaN(ms) && ms >= cycleStartMs && ms < nextResetMs;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let pastDaysSpent = 0;
    let todaySpent = 0;
    let totalCycleSpent = 0;

    for (const tx of cycleTransactions) {
      const ms = new Date(tx.date).getTime();
      totalCycleSpent += tx.amount;
      if (ms < todayStartMs) {
        pastDaysSpent += tx.amount;
      } else if (ms >= todayStartMs && ms < tomorrowStartMs) {
        todaySpent += tx.amount;
      }
    }

    const dailyQuotaBase = monthlyBudget / bounds.totalDaysInCycle;
    // Exact rollover formula for the active cycle (e.g. 10th to 10th):
    // Budget_Disponibile_Oggi = ((Budget_Mensile - Spese_Giorni_Precedenti_Del_Ciclo) / Giorni_Rimanenti_Incluso_Oggi) - Spese_Oggi
    const dailyQuotaToday = (monthlyBudget - pastDaysSpent) / bounds.daysRemaining;
    const availableToday = dailyQuotaToday - todaySpent;
    const monthlyRemaining = monthlyBudget - totalCycleSpent;
    const rolloverDelta = dailyQuotaToday - dailyQuotaBase;

    // Status thresholds relative to today's recalculated quota
    let ratio = 0;
    let status = "danger";

    if (monthlyBudget > 0 && dailyQuotaToday > 0 && availableToday >= 0) {
      ratio = availableToday / dailyQuotaToday;
      if (ratio > 0.5) {
        status = "ok"; // Green #30D158
      } else if (ratio >= 0.2) {
        status = "warning"; // Orange #FF9F0A
      } else {
        status = "danger"; // Red #FF453A
      }
    } else {
      ratio = 0;
      status = "danger"; // Red #FF453A on overspend or exhausted budget
    }

    const clampedRatio = Math.max(0, Math.min(1, ratio));

    return {
      now,
      resetDay: bounds.resetDay,
      cycleStart: bounds.cycleStart,
      nextReset: bounds.nextReset,
      cycleEndInclusive: bounds.cycleEndInclusive,
      currentCycleDay: bounds.currentCycleDay,
      totalDaysInCycle: bounds.totalDaysInCycle,
      daysRemaining: bounds.daysRemaining,
      monthlyBudget,
      cycleTransactions,
      pastDaysSpent,
      todaySpent,
      totalCycleSpent,
      dailyQuotaBase,
      dailyQuotaToday,
      availableToday,
      monthlyRemaining,
      rolloverDelta,
      ratio,
      clampedRatio,
      status
    };
  }

  // =========================================================================
  // Google Apps Script API Client
  // =========================================================================
  function buildGetUrl() {
    const base = state.config.apiUrl.trim();
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}token=${encodeURIComponent(state.config.apiToken)}`;
  }

  async function apiFetchTransactions() {
    const response = await fetch(buildGetUrl(), {
      method: "GET",
      redirect: "follow",
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Errore HTTP ${response.status}`);
    }

    const text = await response.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error("Risposta API non valida (atteso JSON)");
    }

    if (json && typeof json === "object" && !Array.isArray(json)) {
      if (json.error) {
        throw new Error(String(json.error));
      }
      if (json.ok === false || json.status === "error") {
        throw new Error(String(json.message || "Token non valido o errore server"));
      }
    }

    const rawList = Array.isArray(json)
      ? json
      : json.transactions || json.data || json.items || json.rows || [];

    if (!Array.isArray(rawList)) {
      throw new Error("Formato lista transazioni non riconosciuto");
    }

    return rawList
      .map((item, idx) => normalizeTransaction(item, idx))
      .filter(Boolean);
  }

  async function apiPostAction(payload) {
    const response = await fetch(state.config.apiUrl.trim(), {
      method: "POST",
      headers: {
        // text/plain avoids CORS preflight OPTIONS with Google Apps Script
        "Content-Type": "text/plain;charset=utf-8"
      },
      redirect: "follow",
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Errore HTTP ${response.status}`);
    }

    const text = await response.text();
    if (!text.trim()) return { ok: true };

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      return { ok: true };
    }

    if (json && (json.error || json.ok === false || json.status === "error")) {
      throw new Error(String(json.error || json.message || "Operazione rifiutata dal server"));
    }

    return json;
  }

  async function syncTransactions({ silent = false } = {}) {
    if (!isApiConfigured()) {
      updateSyncStatusUI();
      return;
    }
    if (state.isSyncing) return;

    state.isSyncing = true;
    dom.btnRefresh.classList.add("spinning");
    updateSyncStatusUI("syncing");

    try {
      const remoteList = await apiFetchTransactions();
      state.transactions = remoteList;
      state.isSyncing = false;
      saveTransactionsCache();
      saveLastSync(new Date());
      renderAll();
      updateSyncStatusUI("synced");
      if (!silent) {
        showToast("Transazioni aggiornate", "success");
      }
    } catch (err) {
      console.error("[Budget PWA] Sync failed:", err);
      state.isSyncing = false;
      updateSyncStatusUI(navigator.onLine ? "error" : "offline");
      if (!silent) {
        showToast(`Sync fallita: ${err.message || "verifica connessione"}`, "error");
      }
    } finally {
      state.isSyncing = false;
      dom.btnRefresh.classList.remove("spinning");
    }
  }

  // =========================================================================
  // UI Rendering
  // =========================================================================
  function updateSyncStatusUI(forcedState = null) {
    dom.syncDot.className = "sync-dot";

    if (forcedState === "syncing" || (forcedState === null && state.isSyncing)) {
      dom.syncDot.classList.add("syncing");
      dom.syncStatusText.textContent = "Sincronizzazione…";
      return;
    }

    if (!isApiConfigured()) {
      dom.syncDot.classList.add("offline");
      dom.syncStatusText.textContent = "Modalità locale · Configura API";
      return;
    }

    if (forcedState === "error") {
      dom.syncDot.classList.add("error");
      dom.syncStatusText.textContent = state.lastSync
        ? `Offline · Cache ${formatTime(state.lastSync)}`
        : "Errore connessione API";
      return;
    }

    if (!navigator.onLine || forcedState === "offline") {
      dom.syncDot.classList.add("offline");
      dom.syncStatusText.textContent = state.lastSync
        ? `Offline · Cache ${formatTime(state.lastSync)}`
        : "Offline";
      return;
    }

    if (state.lastSync) {
      dom.syncDot.classList.add("synced");
      dom.syncStatusText.textContent = `Aggiornato alle ${formatTime(state.lastSync)}`;
    } else {
      dom.syncStatusText.textContent = "Pronto alla sincronizzazione";
    }
  }

  function formatShortDayMonth(dateObj) {
    return new Intl.DateTimeFormat("it-IT", {
      day: "numeric",
      month: "short"
    }).format(dateObj);
  }

  function renderAll() {
    const metrics = calculateBudgetMetrics(
      state.transactions,
      state.config.monthlyBudget,
      new Date(),
      state.config.resetDay
    );

    // Header Cycle Title (e.g. "10 nov – 9 dic")
    const startLabel = formatShortDayMonth(metrics.cycleStart);
    const endLabel = formatShortDayMonth(metrics.cycleEndInclusive);
    dom.monthTitle.textContent = `${startLabel} – ${endLabel}`;

    // Circular SVG Widget
    const isNegative = metrics.availableToday < -0.005;
    dom.ringContainer.dataset.status = metrics.status;
    dom.ringContainer.classList.toggle("overspend", isNegative);
    dom.ringProgress.style.strokeDasharray = `${RING_CIRCUMFERENCE.toFixed(2)}`;
    // On overspend show full red warning ring; otherwise show remaining quota arc
    const dashOffset = isNegative ? 0 : RING_CIRCUMFERENCE * (1 - metrics.clampedRatio);
    dom.ringProgress.style.strokeDashoffset = `${dashOffset.toFixed(2)}`;

    dom.ringStatusLabel.textContent = isNegative ? "SFORAMENTO OGGI" : "DISPONIBILE OGGI";
    dom.todayAvailable.textContent = formatEuro(metrics.availableToday);
    dom.todayAvailable.classList.toggle("negative", isNegative);

    const daysWord = metrics.daysRemaining === 1 ? "giorno" : "gg";
    dom.ringSublabel.textContent = `su ${formatEuro(Math.max(0, metrics.dailyQuotaToday))} · ${metrics.daysRemaining} ${daysWord} rimasti`;
    dom.todaySpentLabel.textContent = `Speso oggi: ${formatEuro(metrics.todaySpent)}`;

    // Metrics Summary Card
    dom.metricDailyQuota.textContent = formatEuro(metrics.dailyQuotaToday);
    dom.metricDailyQuota.classList.toggle("negative", metrics.dailyQuotaToday < 0);

    if (Math.abs(metrics.rolloverDelta) < 0.01) {
      dom.metricRolloverDelta.textContent = "In linea con la base";
      dom.metricRolloverDelta.className = "metric-sub";
    } else if (metrics.rolloverDelta > 0) {
      dom.metricRolloverDelta.textContent = `Rollover ${formatSignedEuro(metrics.rolloverDelta)}/gg`;
      dom.metricRolloverDelta.className = "metric-sub positive";
    } else {
      dom.metricRolloverDelta.textContent = `Rollover ${formatSignedEuro(metrics.rolloverDelta)}/gg`;
      dom.metricRolloverDelta.className =
        metrics.dailyQuotaToday < 0 ? "metric-sub danger" : "metric-sub negative";
    }

    dom.metricBaseQuota.textContent = formatEuro(metrics.dailyQuotaBase);
    dom.metricBaseDetail.textContent = `${formatEuro(metrics.monthlyBudget, true)} / ${metrics.totalDaysInCycle} gg`;

    dom.metricMonthSpent.textContent = formatEuro(metrics.totalCycleSpent);
    const spentPct =
      metrics.monthlyBudget > 0
        ? Math.round((metrics.totalCycleSpent / metrics.monthlyBudget) * 100)
        : 0;
    dom.metricMonthSpentPct.textContent = `${spentPct}% del budget`;
    dom.metricMonthSpentPct.className =
      spentPct > 100 ? "metric-sub danger" : spentPct >= 85 ? "metric-sub negative" : "metric-sub";

    dom.metricMonthRemaining.textContent = formatEuro(metrics.monthlyRemaining);
    dom.metricMonthRemaining.classList.toggle("negative", metrics.monthlyRemaining < -0.005);
    dom.metricDaysRemaining.textContent =
      metrics.daysRemaining === 1
        ? `Reset domani (${formatShortDayMonth(metrics.nextReset)})`
        : `${metrics.daysRemaining} gg · Reset ${formatShortDayMonth(metrics.nextReset)}`;

    // Cycle Progress Bar
    const fillPct = Math.max(0, Math.min(100, spentPct));
    const elapsedPct = Math.max(
      2,
      Math.min(98, (metrics.currentCycleDay / metrics.totalDaysInCycle) * 100)
    );
    dom.monthProgressFill.style.width = `${fillPct}%`;
    dom.monthProgressTodayMarker.style.left = `${elapsedPct.toFixed(1)}%`;

    if (spentPct > 100) {
      dom.monthProgressFill.style.backgroundColor = "var(--ios-red)";
    } else if (spentPct > elapsedPct + 10) {
      dom.monthProgressFill.style.backgroundColor = "var(--ios-orange)";
    } else {
      dom.monthProgressFill.style.backgroundColor = "var(--ios-green)";
    }

    dom.monthProgressLeft.textContent = `Giorno ${metrics.currentCycleDay} di ${metrics.totalDaysInCycle}`;
    dom.monthProgressRight.textContent = `Budget ${formatEuro(metrics.monthlyBudget, true)}`;

    // Grouped Transactions List
    renderTransactionsList(metrics.cycleTransactions, metrics.now);
  }

  function renderTransactionsList(cycleTransactions, now) {
    const count = cycleTransactions.length;
    dom.transactionsCount.textContent =
      count === 1 ? "1 movimento" : `${count} movimenti`;

    if (count === 0) {
      dom.transactionsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="2" y="5" width="20" height="14" rx="3" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <p class="empty-state-title">Nessuna spesa in questo periodo</p>
          <p class="empty-state-desc">Premi il tasto + in basso per registrare la prima spesa o trascina verso il basso per sincronizzare.</p>
        </div>
      `;
      return;
    }

    // Group by local day key
    const groupsMap = new Map();
    for (const tx of cycleTransactions) {
      const dateObj = new Date(tx.date);
      const key = getLocalDateKey(dateObj);
      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          key,
          dateObj,
          label: formatDayGroupLabel(dateObj, now),
          total: 0,
          items: []
        });
      }
      const group = groupsMap.get(key);
      group.total += tx.amount;
      group.items.push(tx);
    }

    const fragment = document.createDocumentFragment();

    for (const group of groupsMap.values()) {
      const section = document.createElement("div");
      section.className = "day-group";

      const header = document.createElement("div");
      header.className = "day-group-header";
      header.innerHTML = `
        <span class="day-group-label">${escapeHtml(group.label)}</span>
        <span class="day-group-total">-${escapeHtml(formatEuro(group.total))}</span>
      `;
      section.appendChild(header);

      const ul = document.createElement("ul");
      ul.className = "day-list";

      for (const tx of group.items) {
        const cat = getCategoryInfo(tx.category);
        const dateObj = new Date(tx.date);

        const li = document.createElement("li");
        li.className = `tx-item${tx._pending ? " pending" : ""}`;
        li.dataset.id = tx.id;

        li.innerHTML = `
          <div class="tx-swipe-bg" aria-hidden="true">Elimina</div>
          <div class="tx-row-wrap">
            <div class="tx-row">
              <div class="tx-cat-icon" style="color: ${cat.color}; background-color: ${cat.color}1F;" aria-hidden="true">
                ${cat.icon}
              </div>
              <div class="tx-info">
                <div class="tx-merchant">${escapeHtml(tx.merchant)}</div>
                <div class="tx-meta">${escapeHtml(tx.category)} · ${escapeHtml(formatTime(dateObj))}</div>
              </div>
              <div class="tx-right">
                <span class="tx-amount">-${escapeHtml(formatEuro(tx.amount))}</span>
                <button
                  type="button"
                  class="tx-delete-btn"
                  data-action="delete"
                  data-id="${escapeHtml(tx.id)}"
                  aria-label="Elimina spesa ${escapeHtml(tx.merchant)}"
                >
                  ${TRASH_ICON}
                </button>
              </div>
            </div>
          </div>
        `;

        attachSwipeToDelete(li, tx);
        ul.appendChild(li);
      }

      section.appendChild(ul);
      fragment.appendChild(section);
    }

    dom.transactionsContainer.innerHTML = "";
    dom.transactionsContainer.appendChild(fragment);
  }

  function renderCategoryPicker() {
    dom.categoryGrid.innerHTML = CATEGORIES.map((cat, idx) => {
      const selected = idx === 0;
      return `
        <button
          type="button"
          class="category-chip${selected ? " selected" : ""}"
          role="radio"
          aria-checked="${selected ? "true" : "false"}"
          data-category="${escapeHtml(cat.id)}"
        >
          <span style="color: ${cat.color}; display: inline-flex;">${cat.icon}</span>
          <span>${escapeHtml(cat.label)}</span>
        </button>
      `;
    }).join("");
  }

  function selectCategoryChip(categoryId) {
    dom.inputCategory.value = categoryId;
    const chips = dom.categoryGrid.querySelectorAll(".category-chip");
    chips.forEach((chip) => {
      const isSelected = chip.dataset.category === categoryId;
      chip.classList.toggle("selected", isSelected);
      chip.setAttribute("aria-checked", isSelected ? "true" : "false");
    });
  }

  // =========================================================================
  // Toast Feedback
  // =========================================================================
  function showToast(message, type = "default") {
    if (state.toastTimer) {
      clearTimeout(state.toastTimer);
    }
    dom.toast.textContent = message;
    dom.toast.className = `toast ${type}`;
    // Force reflow for crisp re-trigger
    void dom.toast.offsetWidth;
    dom.toast.classList.add("visible");

    state.toastTimer = setTimeout(() => {
      dom.toast.classList.remove("visible");
    }, 2800);
  }

  // =========================================================================
  // Modal Controls
  // =========================================================================
  function openModal(backdropEl) {
    backdropEl.hidden = false;
    requestAnimationFrame(() => {
      backdropEl.classList.add("open");
    });
    document.body.style.overflow = "hidden";
  }

  function closeModal(backdropEl) {
    backdropEl.classList.remove("open");
    document.body.style.overflow = "";
    setTimeout(() => {
      if (!backdropEl.classList.contains("open")) {
        backdropEl.hidden = true;
      }
    }, 360);
  }

  function isAnyModalOpen() {
    return (
      !dom.modalAdd.hidden ||
      !dom.modalSettings.hidden ||
      !dom.modalDelete.hidden
    );
  }

  function openAddModal() {
    dom.formAdd.reset();
    selectCategoryChip("Cibo");
    openModal(dom.modalAdd);
    setTimeout(() => dom.inputAmount.focus(), 220);
  }

  function openSettingsModal({ mandatory = false } = {}) {
    dom.inputBudget.value = String(state.config.monthlyBudget).replace(".", ",");
    dom.inputResetDay.value = String(sanitizeResetDay(state.config.resetDay));
    dom.inputApiUrl.value = state.config.apiUrl;
    dom.inputApiToken.value = state.config.apiToken;
    dom.inputApiToken.type = "password";
    dom.btnToggleToken.textContent = "Mostra";
    dom.btnCancelSettings.hidden = mandatory;
    openModal(dom.modalSettings);
  }

  function openDeleteSheet(tx) {
    state.pendingDeleteTx = tx;
    dom.deleteSheetTitle.textContent = `Eliminare "${tx.merchant}" (${formatEuro(tx.amount)})?`;
    dom.deleteSheetDesc.textContent = isApiConfigured()
      ? "La voce verrà rimossa anche dal foglio Google Sheets."
      : "La voce verrà rimossa dalla cache locale.";
    openModal(dom.modalDelete);
  }

  // =========================================================================
  // Transaction Actions (Add & Delete with Optimistic UI)
  // =========================================================================
  async function handleAddExpense(event) {
    event.preventDefault();

    const amount = parseEuroInput(dom.inputAmount.value);
    const merchant = dom.inputMerchant.value.trim();
    const category = dom.inputCategory.value || "Altro";

    if (!Number.isFinite(amount) || amount <= 0) {
      showToast("Inserisci un importo valido", "error");
      dom.inputAmount.focus();
      return;
    }

    if (!merchant) {
      showToast("Inserisci un esercente o descrizione", "error");
      dom.inputMerchant.focus();
      return;
    }

    const roundedAmount = Math.round(amount * 100) / 100;
    const isoDate = new Date().toISOString();
    const tempId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const optimisticTx = {
      id: tempId,
      amount: roundedAmount,
      merchant,
      category,
      date: isoDate,
      _pending: isApiConfigured()
    };

    // Optimistic UI update
    state.transactions = [optimisticTx, ...state.transactions];
    saveTransactionsCache();
    renderAll();
    closeModal(dom.modalAdd);

    if (!isApiConfigured()) {
      showToast(`Spesa salvata (${formatEuro(roundedAmount)})`, "success");
      return;
    }

    try {
      const result = await apiPostAction({
        token: state.config.apiToken,
        action: "add",
        amount: roundedAmount,
        merchant,
        category,
        date: isoDate
      });

      const returnedId =
        result?.id ?? result?.data?.id ?? result?.transaction?.id ?? null;

      const idx = state.transactions.findIndex((item) => item.id === tempId);
      if (idx !== -1) {
        state.transactions[idx] = {
          ...state.transactions[idx],
          id: returnedId ? String(returnedId) : tempId,
          _pending: false
        };
      }
      saveTransactionsCache();
      saveLastSync(new Date());
      renderAll();
      updateSyncStatusUI("synced");
      showToast(`Aggiunta spesa di ${formatEuro(roundedAmount)}`, "success");

      // If server did not return an explicit ID, refresh quietly to get canonical Sheet ID
      if (!returnedId) {
        syncTransactions({ silent: true });
      }
    } catch (err) {
      console.error("[Budget PWA] Add failed:", err);
      state.transactions = state.transactions.filter((item) => item.id !== tempId);
      saveTransactionsCache();
      renderAll();
      showToast(`Errore salvataggio: ${err.message || "riprova"}`, "error");
    }
  }

  async function handleConfirmDelete() {
    const tx = state.pendingDeleteTx;
    if (!tx) return;
    state.pendingDeleteTx = null;
    closeModal(dom.modalDelete);

    const originalIndex = state.transactions.findIndex((item) => item.id === tx.id);
    if (originalIndex === -1) return;

    // Optimistic removal
    const removed = state.transactions[originalIndex];
    state.transactions.splice(originalIndex, 1);
    saveTransactionsCache();
    renderAll();

    if (!isApiConfigured()) {
      showToast("Spesa eliminata", "success");
      return;
    }

    try {
      await apiPostAction({
        token: state.config.apiToken,
        action: "delete",
        id: tx.id
      });
      saveLastSync(new Date());
      updateSyncStatusUI("synced");
      showToast("Spesa eliminata", "success");
    } catch (err) {
      console.error("[Budget PWA] Delete failed:", err);
      // Rollback on failure
      state.transactions.splice(originalIndex, 0, removed);
      saveTransactionsCache();
      renderAll();
      showToast(`Errore eliminazione: ${err.message || "riprova"}`, "error");
    }
  }

  async function handleSaveSettings(event) {
    event.preventDefault();

    const budget = parseEuroInput(dom.inputBudget.value);
    const rawResetDay = Number.parseInt(dom.inputResetDay.value, 10);
    const apiUrl = dom.inputApiUrl.value.trim();
    const apiToken = dom.inputApiToken.value.trim();

    if (!Number.isFinite(budget) || budget <= 0) {
      showToast("Inserisci un budget mensile valido", "error");
      dom.inputBudget.focus();
      return;
    }

    if (!Number.isFinite(rawResetDay) || rawResetDay < 1 || rawResetDay > 28) {
      showToast("Il giorno di reset deve essere tra 1 e 28", "error");
      dom.inputResetDay.focus();
      return;
    }

    if (apiUrl && !/^https?:\/\/.+/i.test(apiUrl)) {
      showToast("L'API URL deve iniziare con https://", "error");
      dom.inputApiUrl.focus();
      return;
    }

    if (apiUrl && !apiToken) {
      showToast("Inserisci anche il Token segreto", "error");
      dom.inputApiToken.focus();
      return;
    }

    state.config = {
      apiUrl,
      apiToken,
      monthlyBudget: Math.round(budget * 100) / 100,
      resetDay: rawResetDay,
      localMode: !apiUrl
    };
    saveConfigToStorage();
    closeModal(dom.modalSettings);
    renderAll();

    if (isApiConfigured()) {
      await syncTransactions({ silent: false });
    } else {
      updateSyncStatusUI();
      showToast("Impostazioni salvate in locale", "success");
    }
  }

  function handleLocalModeClick() {
    const budget = parseEuroInput(dom.inputBudget.value);
    state.config.monthlyBudget = Number.isFinite(budget) && budget > 0 ? budget : 600;
    state.config.resetDay = sanitizeResetDay(dom.inputResetDay.value);
    state.config.apiUrl = "";
    state.config.apiToken = "";
    state.config.localMode = true;
    saveConfigToStorage();
    closeModal(dom.modalSettings);
    renderAll();
    updateSyncStatusUI();
    showToast("Modalità locale attiva", "success");
  }

  function handleClearCache() {
    state.transactions = [];
    saveTransactionsCache();
    saveLastSync(null);
    renderAll();
    updateSyncStatusUI();
    showToast("Cache locale svuotata", "success");
  }

  // =========================================================================
  // Touch Gestures: Swipe-to-Delete & Pull-to-Refresh
  // =========================================================================
  function attachSwipeToDelete(li, tx) {
    const wrap = li.querySelector(".tx-row-wrap");
    if (!wrap) return;

    let startX = 0;
    let startY = 0;
    let currentDx = 0;
    let isHorizontal = null;

    wrap.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length !== 1) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        currentDx = 0;
        isHorizontal = null;
      },
      { passive: true }
    );

    wrap.addEventListener(
      "touchmove",
      (e) => {
        if (e.touches.length !== 1) return;
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;

        if (isHorizontal === null) {
          if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
            isHorizontal = Math.abs(dx) > Math.abs(dy);
          }
          return;
        }

        if (!isHorizontal) return;

        if (dx < 0) {
          wrap.classList.add("swiping");
          currentDx = Math.max(-110, dx);
          wrap.style.transform = `translateX(${currentDx}px)`;
        }
      },
      { passive: true }
    );

    const endSwipe = () => {
      wrap.classList.remove("swiping");
      wrap.style.transform = "";
      if (currentDx <= -74) {
        openDeleteSheet(tx);
      }
      currentDx = 0;
      isHorizontal = null;
    };

    wrap.addEventListener("touchend", endSwipe, { passive: true });
    wrap.addEventListener("touchcancel", endSwipe, { passive: true });
  }

  function initPullToRefresh() {
    const THRESHOLD = 68;
    let startY = 0;
    let pulling = false;
    let pullDist = 0;

    document.addEventListener(
      "touchstart",
      (e) => {
        if (isAnyModalOpen() || state.isSyncing) return;
        if (window.scrollY <= 0 && e.touches.length === 1) {
          startY = e.touches[0].clientY;
          pulling = true;
          pullDist = 0;
        }
      },
      { passive: true }
    );

    document.addEventListener(
      "touchmove",
      (e) => {
        if (!pulling || e.touches.length !== 1) return;
        const dy = e.touches[0].clientY - startY;
        if (dy > 6 && window.scrollY <= 0) {
          // Damped rubber-band pull curve
          pullDist = Math.min(92, (dy - 6) * 0.48);
          dom.ptrIndicator.classList.add("pulling");
          dom.ptrIndicator.style.height = `${pullDist}px`;
          dom.ptrIndicator.style.opacity = `${Math.min(1, pullDist / THRESHOLD)}`;
          dom.ptrSpinner.style.transform = `rotate(${pullDist * 4}deg)`;
          dom.ptrLabel.textContent =
            pullDist >= THRESHOLD ? "Rilascia per aggiornare" : "Trascina per aggiornare";
        } else {
          pullDist = 0;
        }
      },
      { passive: true }
    );

    document.addEventListener(
      "touchend",
      async () => {
        if (!pulling) return;
        pulling = false;
        dom.ptrIndicator.classList.remove("pulling");

        if (pullDist >= THRESHOLD) {
          dom.ptrIndicator.classList.add("refreshing");
          dom.ptrIndicator.style.height = "";
          dom.ptrIndicator.style.opacity = "";
          dom.ptrLabel.textContent = "Aggiornamento…";

          if (isApiConfigured()) {
            await syncTransactions({ silent: false });
          } else {
            renderAll();
            showToast("Configura l'API nelle impostazioni", "default");
          }

          dom.ptrIndicator.classList.remove("refreshing");
        } else {
          dom.ptrIndicator.style.height = "0px";
          dom.ptrIndicator.style.opacity = "0";
        }
        pullDist = 0;
      },
      { passive: true }
    );
  }

  // =========================================================================
  // Event Binding & Lifecycle
  // =========================================================================
  function bindEvents() {
    dom.btnRefresh.addEventListener("click", () => {
      if (!isApiConfigured()) {
        openSettingsModal({ mandatory: false });
        return;
      }
      syncTransactions({ silent: false });
    });

    dom.btnSettings.addEventListener("click", () => openSettingsModal({ mandatory: false }));
    dom.btnAddExpense.addEventListener("click", openAddModal);

    // Add Expense modal events
    dom.btnCancelAdd.addEventListener("click", () => closeModal(dom.modalAdd));
    dom.modalAdd.addEventListener("click", (e) => {
      if (e.target === dom.modalAdd) closeModal(dom.modalAdd);
    });
    dom.formAdd.addEventListener("submit", handleAddExpense);

    dom.categoryGrid.addEventListener("click", (e) => {
      const chip = e.target.closest(".category-chip");
      if (!chip) return;
      selectCategoryChip(chip.dataset.category);
    });

    // Settings modal events
    dom.btnCancelSettings.addEventListener("click", () => closeModal(dom.modalSettings));
    dom.modalSettings.addEventListener("click", (e) => {
      if (e.target === dom.modalSettings && !dom.btnCancelSettings.hidden) {
        closeModal(dom.modalSettings);
      }
    });
    dom.formSettings.addEventListener("submit", handleSaveSettings);

    dom.btnToggleToken.addEventListener("click", () => {
      const isHidden = dom.inputApiToken.type === "password";
      dom.inputApiToken.type = isHidden ? "text" : "password";
      dom.btnToggleToken.textContent = isHidden ? "Nascondi" : "Mostra";
    });

    dom.btnLocalMode.addEventListener("click", handleLocalModeClick);
    dom.btnClearCache.addEventListener("click", handleClearCache);

    // Delete confirmation sheet events
    dom.transactionsContainer.addEventListener("click", (e) => {
      const delBtn = e.target.closest('[data-action="delete"]');
      if (!delBtn) return;
      const txId = delBtn.dataset.id;
      const tx = state.transactions.find((item) => item.id === txId);
      if (tx) openDeleteSheet(tx);
    });

    dom.btnConfirmDelete.addEventListener("click", handleConfirmDelete);
    dom.btnCancelDelete.addEventListener("click", () => {
      state.pendingDeleteTx = null;
      closeModal(dom.modalDelete);
    });
    dom.modalDelete.addEventListener("click", (e) => {
      if (e.target === dom.modalDelete) {
        state.pendingDeleteTx = null;
        closeModal(dom.modalDelete);
      }
    });

    // Keyboard Escape support (desktop / iPad keyboard)
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (!dom.modalDelete.hidden) {
        state.pendingDeleteTx = null;
        closeModal(dom.modalDelete);
      } else if (!dom.modalAdd.hidden) {
        closeModal(dom.modalAdd);
      } else if (!dom.modalSettings.hidden && !dom.btnCancelSettings.hidden) {
        closeModal(dom.modalSettings);
      }
    });

    // Online/offline & app foreground resume (handles midnight rollover automatically)
    window.addEventListener("online", () => {
      updateSyncStatusUI();
      if (isApiConfigured()) {
        syncTransactions({ silent: true });
      }
    });

    window.addEventListener("offline", () => {
      updateSyncStatusUI("offline");
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        renderAll();
        const staleMs = state.lastSync ? Date.now() - state.lastSync.getTime() : Infinity;
        if (isApiConfigured() && staleMs > 60_000) {
          syncTransactions({ silent: true });
        }
      }
    });
  }

  function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").catch((err) => {
          console.warn("[Budget PWA] SW registration failed:", err);
        });
      });
    }
  }

  // =========================================================================
  // Bootstrap
  // =========================================================================
  function init() {
    loadFromStorage();
    renderCategoryPicker();
    bindEvents();
    initPullToRefresh();
    registerServiceWorker();

    // Instant first paint from localStorage cache
    renderAll();
    updateSyncStatusUI();

    if (isFirstRun()) {
      openSettingsModal({ mandatory: false });
    } else if (isApiConfigured()) {
      // Background refresh on launch
      syncTransactions({ silent: true });
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
