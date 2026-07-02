# CharlesCRM

CharlesCRM is a construction-focused CRM/ERP starter plan for a civil engineering business owner who needs to manage projects, labor, materials, expenses, payments, profit/loss, approvals, and site images from one system.

## Recommended Stack

- Backend: Django
- API: Django REST Framework
- Database: PostgreSQL
- Auth: JWT
- Web frontend: React + Vite
- Mobile: Phase 2 with React Native or a responsive web app first
- File storage: local in development, S3/Cloudinary in production

## Why Django Instead of Flask

Django is the better fit here because this product is data-heavy and process-heavy:

- Strong admin panel for internal operations
- Faster CRUD development
- Easier role and permission management
- Mature ORM and migrations
- Better structure for a growing business app

## MVP Modules

Build the first version around these modules:

1. Authentication and roles
2. Projects
3. Daily work logs
4. Labor entries
5. Materials and usage
6. Expenses
7. Payments and billing
8. Profit and loss dashboard
9. Image and document uploads
10. Approvals

## Suggested Repo Structure

```text
backend/
  apps/
    users/
    projects/
    labor/
    materials/
    expenses/
    finance/
    approvals/
    uploads/
    dashboard/
  requirements.txt
  .env.example

frontend/
  src/
    modules/
      auth/
      dashboard/
      projects/
      labor/
      materials/
      expenses/
      finance/
      approvals/
      uploads/
    components/
    pages/
    services/
    hooks/
  package.json
  .env.example

docs/
  crm-blueprint.md
  database-schema.md
  api-design.md
```

## One Week Build Plan

### Day 1

- Finalize requirements and user roles
- Set up Django, DRF, PostgreSQL
- Set up React + Vite
- Define models and relationships

### Day 2

- Build authentication
- Build role-based access
- Build project CRUD

### Day 3

- Add daily work logs
- Add labor management
- Add expense tracking

### Day 4

- Add materials module
- Add file upload module
- Add project detail timeline

### Day 5

- Add payments
- Add project profitability calculations
- Add approval workflow

### Day 6

- Build dashboard and reports
- Add filtering by project, date, and status

### Day 7

- Testing
- UI cleanup
- Responsive polish
- MVP deployment

## Build Order

Start:

- Backend models
- REST APIs
- Project dashboard UI

Finish:

- Profit/loss reporting
- Approval workflow
- Image/document uploads
- Deployment and handover notes

## Next Step

Use the files inside `docs/` as the working blueprint, then scaffold the Django project and React app from those definitions.

## Local Run Notes

The backend uses a local virtual environment in `backend/.venv`.

Use these commands on Windows:

```powershell
cd backend
.venv\Scripts\Activate.ps1
python manage.py runserver
```

If PowerShell activation is blocked, run commands directly with the venv interpreter:

```powershell
cd backend
cmd /c .venv\Scripts\python manage.py runserver
```

If dependencies are missing in the venv, reinstall them with:

```powershell
cd backend
cmd /c .venv\Scripts\python -m pip install -r requirements.txt
```
