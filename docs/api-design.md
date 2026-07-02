# API Design

## Auth

- `POST /api/auth/login/`
- `POST /api/auth/refresh/`
- `GET /api/auth/me/`

## Users

- `GET /api/users/`
- `POST /api/users/`
- `GET /api/users/{id}/`
- `PATCH /api/users/{id}/`

## Projects

- `GET /api/projects/`
- `POST /api/projects/`
- `GET /api/projects/{id}/`
- `PATCH /api/projects/{id}/`
- `GET /api/projects/{id}/summary/`
- `GET /api/projects/{id}/timeline/`

## Daily Logs

- `GET /api/projects/{id}/daily-logs/`
- `POST /api/projects/{id}/daily-logs/`
- `PATCH /api/daily-logs/{id}/`

## Labor

- `GET /api/projects/{id}/labor/`
- `POST /api/projects/{id}/labor/`
- `PATCH /api/labor/{id}/`

## Materials

- `GET /api/materials/`
- `POST /api/materials/`
- `GET /api/projects/{id}/material-purchases/`
- `POST /api/projects/{id}/material-purchases/`
- `GET /api/projects/{id}/material-usage/`
- `POST /api/projects/{id}/material-usage/`

## Expenses

- `GET /api/projects/{id}/expenses/`
- `POST /api/projects/{id}/expenses/`
- `PATCH /api/expenses/{id}/`

## Payments

- `GET /api/projects/{id}/payments/`
- `POST /api/projects/{id}/payments/`
- `PATCH /api/payments/{id}/`

## Uploads

- `GET /api/projects/{id}/files/`
- `POST /api/projects/{id}/files/`

## Approvals

- `GET /api/approvals/`
- `POST /api/approvals/`
- `POST /api/approvals/{id}/approve/`
- `POST /api/approvals/{id}/reject/`

## Dashboard

- `GET /api/dashboard/overview/`
- `GET /api/dashboard/project-profitability/`
- `GET /api/dashboard/labor-cost-trend/`
- `GET /api/dashboard/material-wastage/`
- `GET /api/dashboard/pending-approvals/`
