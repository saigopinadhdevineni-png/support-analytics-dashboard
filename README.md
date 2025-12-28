# support-analytics-dashboard

# Support Analytics Dashboard (CSV → KPIs + Filters + Charts)

A lightweight web dashboard that analyzes support tickets from a CSV file and shows key operational metrics with interactive filters and charts.

## Features
- Upload support tickets CSV
- KPIs:
  - Ticket Volume
  - Avg Resolution Time (hours)
  - SLA Breach %
- Filters:
  - Date range
  - Issue Type
  - Priority
- Charts:
  - Tickets by Issue Type (Bar)
  - Tickets per Day (Line)

## Tech Stack
- HTML, CSS, JavaScript
- Chart.js (visualizations)
- PapaParse (CSV parsing)

## CSV Format (required columns)
ticket_id, created_at, resolved_at, issue_type, priority, sla_hours

Example:
```csv
ticket_id,created_at,resolved_at,issue_type,priority,sla_hours
1001,2025-12-01 09:10,2025-12-01 13:40,Payments,High,4
