# CRM Blueprint

## Product Goal

This CRM is for a civil engineering or construction business owner who wants to manage:

- Multiple projects
- Labor costs
- Materials
- Daily site activities
- Expenses
- Client payments
- Profit and loss
- Images and documents
- Approval flow for spending and purchases

## Core User Roles

### Owner

- Full access
- Views dashboard across all projects
- Approves major expenses and purchases
- Sees overall profit/loss

### Project Manager

- Creates and manages projects
- Adds work logs
- Tracks labor, materials, and expenses

### Site Engineer

- Updates daily progress
- Uploads site images
- Adds labor attendance and material usage

### Accountant

- Manages payments, bills, expenses, and reports

### Viewer

- Read-only access for selected project data

## Main Screens

1. Login
2. Dashboard
3. Project list
4. Project details
5. Daily logs
6. Labor management
7. Materials management
8. Expenses
9. Payments
10. Approvals
11. Uploads and gallery
12. Reports

## Project Detail Page Should Show

- Project summary
- Budget vs actual spend
- Labor cost
- Materials cost
- Other expenses
- Client payments received
- Pending dues
- Profit/loss snapshot
- Daily updates timeline
- Uploaded images and documents
- Pending approvals

## Important Business Rules

- Every labor, material, expense, and payment entry belongs to a project
- Approvals should be required above configurable thresholds
- Project profitability should be calculated from budget, expenses, and received payments
- Material wastage should be tracked where possible
- Daily logs should preserve site history

## Best MVP Scope

The fastest useful MVP is:

- Roles and login
- Project CRUD
- Daily logs
- Labor entries
- Material usage
- Expenses
- Payments
- Dashboard

Keep advanced features like notifications, purchase orders, and mobile app packaging for phase 2.
