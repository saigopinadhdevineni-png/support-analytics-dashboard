let rawData = [];
let barChart, lineChart;

const csvFile = document.getElementById("csvFile");
const fileName = document.getElementById("fileName");

const fromDate = document.getElementById("fromDate");
const toDate = document.getElementById("toDate");
const issueType = document.getElementById("issueType");
const priority = document.getElementById("priority");

document.getElementById("applyFilters").addEventListener("click", () => render());
document.getElementById("resetFilters").addEventListener("click", () => {
  fromDate.value = "";
  toDate.value = "";
  issueType.value = "all";
  priority.value = "all";
  render();
});

csvFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  fileName.textContent = file.name;

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      rawData = normalize(results.data);
      buildDropdowns(rawData);
      setDefaultDates(rawData);
      render();
    }
  });
});

function normalize(rows) {
  return rows.map(r => {
    const created = parseDate(r.created_at);
    const resolved = parseDate(r.resolved_at);
    const slaHours = Number(r.sla_hours);

    const resHours = (created && resolved) ? (resolved - created) / (1000 * 60 * 60) : null;
    const breached = (resHours != null && !Number.isNaN(slaHours)) ? (resHours > slaHours) : false;

    return {
      ticket_id: r.ticket_id,
      created_at: created,
      resolved_at: resolved,
      issue_type: (r.issue_type || "").trim(),
      priority: (r.priority || "").trim(),
      sla_hours: slaHours,
      resolution_hours: resHours,
      sla_breached: breached
    };
  }).filter(x => x.created_at); // created_at mandatory
}

function parseDate(s) {
  if (!s) return null;
  // supports: "YYYY-MM-DD HH:mm" or ISO
  const d = new Date(s.replace(" ", "T"));
  return isNaN(d.getTime()) ? null : d;
}

function buildDropdowns(data) {
  const issues = [...new Set(data.map(d => d.issue_type).filter(Boolean))].sort();
  const priorities = [...new Set(data.map(d => d.priority).filter(Boolean))].sort();

  issueType.innerHTML = `<option value="all">All</option>` + issues.map(i => `<option value="${i}">${i}</option>`).join("");
  priority.innerHTML = `<option value="all">All</option>` + priorities.map(p => `<option value="${p}">${p}</option>`).join("");
}

function setDefaultDates(data) {
  const dates = data.map(d => d.created_at).filter(Boolean).sort((a,b)=>a-b);
  if (dates.length === 0) return;

  const min = toInputDate(dates[0]);
  const max = toInputDate(dates[dates.length - 1]);

  fromDate.value = min;
  toDate.value = max;
}

function toInputDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
}

function applyFilters(data) {
  let filtered = [...data];

  if (fromDate.value) {
    const fd = new Date(fromDate.value + "T00:00:00");
    filtered = filtered.filter(d => d.created_at >= fd);
  }
  if (toDate.value) {
    const td = new Date(toDate.value + "T23:59:59");
    filtered = filtered.filter(d => d.created_at <= td);
  }
  if (issueType.value !== "all") {
    filtered = filtered.filter(d => d.issue_type === issueType.value);
  }
  if (priority.value !== "all") {
    filtered = filtered.filter(d => d.priority === priority.value);
  }

  return filtered;
}

function render() {
  if (!rawData.length) {
    setKPIs([], true);
    drawCharts([], []);
    return;
  }
  const filtered = applyFilters(rawData);
  setKPIs(filtered, false);
  drawCharts(filtered);
}

function setKPIs(data, empty) {
  const volEl = document.getElementById("kpiVolume");
  const avgEl = document.getElementById("kpiAvgRes");
  const slaEl = document.getElementById("kpiSla");

  if (empty || data.length === 0) {
    volEl.textContent = "0";
    avgEl.textContent = "—";
    slaEl.textContent = "—";
    return;
  }

  const volume = data.length;

  const resList = data.map(d => d.resolution_hours).filter(v => v != null && !isNaN(v));
  const avgRes = resList.length ? (resList.reduce((a,b)=>a+b,0) / resList.length) : null;

  const breachedCount = data.filter(d => d.sla_breached).length;
  const slaPct = (breachedCount / volume) * 100;

  volEl.textContent = String(volume);
  avgEl.textContent = avgRes == null ? "—" : avgRes.toFixed(2);
  slaEl.textContent = `${slaPct.toFixed(1)}%`;
}

function drawCharts(data) {
  // Bar: tickets by issue type
  const byIssue = {};
  data.forEach(d => {
    const k = d.issue_type || "Unknown";
    byIssue[k] = (byIssue[k] || 0) + 1;
  });
  const barLabels = Object.keys(byIssue);
  const barValues = Object.values(byIssue);

  // Line: tickets per day
  const byDay = {};
  data.forEach(d => {
    const day = toInputDate(d.created_at);
    byDay[day] = (byDay[day] || 0) + 1;
  });
  const lineLabels = Object.keys(byDay).sort();
  const lineValues = lineLabels.map(k => byDay[k]);

  // Destroy old charts if exist
  if (barChart) barChart.destroy();
  if (lineChart) lineChart.destroy();

  const barCtx = document.getElementById("barChart");
  const lineCtx = document.getElementById("lineChart");

  barChart = new Chart(barCtx, {
    type: "bar",
    data: {
      labels: barLabels,
      datasets: [{ label: "Tickets", data: barValues }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } }
    }
  });

  lineChart = new Chart(lineCtx, {
    type: "line",
    data: {
      labels: lineLabels,
      datasets: [{ label: "Tickets/day", data: lineValues }]
    },
    options: { responsive: true }
  });
}
