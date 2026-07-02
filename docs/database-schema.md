# Database Schema

## users_user

- id
- full_name
- email
- phone
- password
- role
- is_active
- created_at
- updated_at

## projects_project

- id
- name
- code
- client_name
- location
- description
- start_date
- end_date
- status
- estimated_budget
- estimated_revenue
- project_type
- created_by_id
- created_at
- updated_at

## projects_projectmember

- id
- project_id
- user_id
- member_role
- assigned_at

## projects_dailylog

- id
- project_id
- log_date
- title
- description
- progress_percent
- issue_notes
- weather_notes
- created_by_id
- created_at

## labor_laborentry

- id
- project_id
- work_date
- labor_type
- worker_name
- contractor_name
- attendance_days
- wage_per_day
- overtime_amount
- total_amount
- notes
- created_by_id
- created_at

## materials_material

- id
- name
- category
- unit
- default_rate
- description
- created_at

## materials_materialpurchase

- id
- project_id
- material_id
- supplier_name
- quantity
- unit_rate
- total_amount
- purchase_date
- invoice_number
- notes
- created_by_id
- created_at

## materials_materialusage

- id
- project_id
- material_id
- usage_date
- quantity_used
- quantity_wasted
- area_or_task
- notes
- created_by_id
- created_at

## expenses_expense

- id
- project_id
- expense_date
- category
- title
- amount
- vendor_name
- payment_mode
- receipt_number
- notes
- approval_status
- created_by_id
- created_at

## finance_payment

- id
- project_id
- payment_date
- payment_type
- amount
- reference_number
- received_from
- due_date
- notes
- created_by_id
- created_at

## uploads_projectfile

- id
- project_id
- file
- file_type
- title
- description
- uploaded_by_id
- created_at

## approvals_approvalrequest

- id
- project_id
- module_name
- record_id
- request_type
- requested_by_id
- approved_by_id
- status
- amount
- remarks
- requested_at
- actioned_at

## Calculated Metrics

### Total Labor Cost

Sum of `labor_laborentry.total_amount` by project

### Total Material Cost

Sum of `materials_materialpurchase.total_amount` by project

### Total Other Expenses

Sum of `expenses_expense.amount` by project

### Total Spend

`labor cost + material cost + other expenses`

### Total Received

Sum of `finance_payment.amount` where payment type is incoming

### Current Profit/Loss

`total received - total spend`

### Budget Variance

`estimated_budget - total spend`
