from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.approvals.models import ApprovalRequest
from apps.boq.models import BOQ
from apps.equipment.models import Equipment
from apps.expenses.models import Expense
from apps.finance.models import Payment
from apps.labor.models import LaborEntry
from apps.materials.models import Material, MaterialPurchase, MaterialUsage
from apps.projects.models import DailyLog, Project, ProjectMember
from apps.purchase_orders.models import PurchaseOrder
from apps.quotations.models import Quotation, QuotationLineItem
from apps.users.models import User
from apps.vendors.models import Vendor


class Command(BaseCommand):
    help = "Seed CharlesCRM with realistic demo records for frontend screens."

    def handle(self, *args, **options):
        today = timezone.localdate()

        owner, _ = User.objects.update_or_create(
            email="owner@charlescrm.local",
            defaults={
                "username": "owner",
                "full_name": "Charles Mathew",
                "phone": "9876543201",
                "role": User.Role.OWNER,
                "is_staff": True,
                "is_superuser": True,
            },
        )
        owner.set_password("admin123")
        owner.save()

        team_rows = [
            ("manager@charlescrm.local", "Maya Iyer", "manager", "9876543202", User.Role.MANAGER),
            ("engineer@charlescrm.local", "Arjun Nair", "site_engineer", "9876543203", User.Role.SITE_ENGINEER),
            ("accounts@charlescrm.local", "Rina Thomas", "accounts", "9876543204", User.Role.ACCOUNTANT),
            ("viewer@charlescrm.local", "Dev Patel", "viewer", "9876543205", User.Role.VIEWER),
        ]
        users = [owner]
        for email, full_name, username, phone, role in team_rows:
            user, _ = User.objects.update_or_create(
                email=email,
                defaults={"username": username, "full_name": full_name, "phone": phone, "role": role},
            )
            user.set_password("admin123")
            user.save()
            users.append(user)

        project_rows = [
            ("CC-101", "Lakeview Villas", "Aster Homes", "Kochi", "active", 18400000, 24500000, "Residential"),
            ("CC-102", "Metro Depot Slab Works", "Urban Transit Ltd", "Chennai", "active", 12800000, 17100000, "Infrastructure"),
            ("CC-103", "Hillcrest School Block", "Hillcrest Trust", "Coimbatore", "planning", 9200000, 12400000, "Institutional"),
            ("CC-104", "Riverbend Retaining Wall", "Greenway Estates", "Mysuru", "on_hold", 5800000, 7200000, "Civil Works"),
            ("CC-105", "Palm Court Interiors", "Palm Court LLP", "Bengaluru", "active", 7600000, 10100000, "Commercial"),
            ("CC-106", "Harbor Warehouse", "BluePort Logistics", "Mangalore", "completed", 15500000, 19800000, "Industrial"),
            ("CC-107", "North Gate Drainage", "City Works Dept", "Trichy", "active", 6400000, 8200000, "Public Works"),
            ("CC-108", "Skyline Podium", "Skyline Builders", "Hyderabad", "planning", 21200000, 28600000, "High Rise"),
        ]
        projects = []
        for index, row in enumerate(project_rows):
            code, name, client, location, status, budget, revenue, project_type = row
            project, _ = Project.objects.update_or_create(
                code=code,
                defaults={
                    "name": name,
                    "client_name": client,
                    "location": location,
                    "description": f"{project_type} package with cost tracking, site logs, and approvals.",
                    "start_date": today - timedelta(days=90 - index * 7),
                    "end_date": today + timedelta(days=120 + index * 14),
                    "status": status,
                    "estimated_budget": Decimal(str(budget)),
                    "estimated_revenue": Decimal(str(revenue)),
                    "project_type": project_type,
                    "created_by": owner,
                },
            )
            projects.append(project)
            for user in users[:3]:
                ProjectMember.objects.update_or_create(
                    project=project,
                    user=user,
                    defaults={"member_role": "Core Team"},
                )

        material_rows = [
            ("OPC Cement", "Cement", "bag", 410),
            ("TMT Steel 12mm", "Steel", "kg", 67),
            ("M Sand", "Aggregate", "cft", 54),
            ("Blue Metal 20mm", "Aggregate", "cft", 62),
            ("Red Brick", "Masonry", "nos", 9),
            ("Ready Mix M25", "Concrete", "cum", 5200),
            ("Electrical Conduit", "Electrical", "m", 42),
            ("Waterproofing Chemical", "Finishing", "ltr", 185),
        ]
        materials = []
        for name, category, unit, rate in material_rows:
            material, _ = Material.objects.update_or_create(
                name=name,
                defaults={
                    "category": category,
                    "unit": unit,
                    "default_rate": Decimal(str(rate)),
                    "description": f"Standard {category.lower()} item for site consumption.",
                },
            )
            materials.append(material)

        vendor_rows = [
            ("Prime Cement Traders", "9876500011", "prime@example.com", "32ABCDE1234F1Z1", "Market Road, Kochi"),
            ("Kaveri Steel Mart", "9876500012", "steel@example.com", "29ABCDE1234F1Z2", "Industrial Area, Bengaluru"),
            ("Metro Sand Supply", "9876500013", "sand@example.com", "33ABCDE1234F1Z3", "OMR, Chennai"),
            ("BuildRight Electricals", "9876500014", "electrical@example.com", "32ABCDE1234F1Z4", "Edappally, Kochi"),
            ("Apex Equipment Rentals", "9876500015", "rental@example.com", "29ABCDE1234F1Z5", "Peenya, Bengaluru"),
            ("BlueLine Logistics", "9876500016", "logistics@example.com", "33ABCDE1234F1Z6", "Guindy, Chennai"),
        ]
        vendors = []
        for name, phone, email, gst, address in vendor_rows:
            vendor, _ = Vendor.objects.update_or_create(
                name=name,
                defaults={"phone": phone, "email": email, "gst_number": gst, "address": address},
            )
            vendors.append(vendor)

        for index, project in enumerate(projects):
            DailyLog.objects.update_or_create(
                project=project,
                log_date=today - timedelta(days=index + 1),
                title=f"{project.name} daily progress",
                defaults={
                    "description": "Site work updated with manpower, material movement, and next-day priority.",
                    "progress_percent": min(92, 18 + index * 9),
                    "issue_notes": "Watch material delivery timing." if index % 3 == 0 else "",
                    "weather_notes": "Clear morning, light evening showers" if index % 2 == 0 else "Dry and workable",
                    "created_by": users[index % len(users)],
                },
            )

            labor_total = Decimal(str((850 + index * 75) * (5 + index % 4)))
            LaborEntry.objects.update_or_create(
                project=project,
                work_date=today - timedelta(days=index + 2),
                worker_name=f"Site Crew {index + 1}",
                defaults={
                    "labor_type": ["Mason", "Helper", "Bar Bender", "Carpenter"][index % 4],
                    "contractor_name": ["Mohan Contracts", "Elite Labour", "SiteForce", "Nila Works"][index % 4],
                    "attendance_days": Decimal(str(5 + index % 4)),
                    "wage_per_day": Decimal(str(850 + index * 75)),
                    "overtime_amount": Decimal(str(index * 250)),
                    "total_amount": labor_total + Decimal(str(index * 250)),
                    "notes": "Demo labor entry for payroll and project burn.",
                    "created_by": users[index % len(users)],
                },
            )

            material = materials[index % len(materials)]
            quantity = Decimal(str(80 + index * 14))
            unit_rate = material.default_rate
            MaterialPurchase.objects.update_or_create(
                project=project,
                material=material,
                purchase_date=today - timedelta(days=index + 4),
                invoice_number=f"INV-DEMO-{index + 101}",
                defaults={
                    "supplier_name": vendors[index % len(vendors)].name,
                    "quantity": quantity,
                    "unit_rate": unit_rate,
                    "total_amount": quantity * unit_rate,
                    "notes": "Demo purchase for material tracking.",
                    "created_by": owner,
                },
            )
            MaterialUsage.objects.update_or_create(
                project=project,
                material=material,
                usage_date=today - timedelta(days=index + 1),
                defaults={
                    "quantity_used": Decimal(str(35 + index * 8)),
                    "quantity_wasted": Decimal(str(index % 3)),
                    "area_or_task": ["Footing", "Slab", "Blockwork", "Plaster", "Services"][index % 5],
                    "notes": "Demo usage entry with wastage visibility.",
                    "created_by": users[index % len(users)],
                },
            )

            demo_loss_expenses = {
                3: Decimal("925000"),
                6: Decimal("1180000"),
            }
            expense_amount = demo_loss_expenses.get(index, Decimal(str(6500 + index * 1850)))
            expense, _ = Expense.objects.update_or_create(
                project=project,
                expense_date=today - timedelta(days=index + 3),
                title=f"{project.code} site expense",
                defaults={
                    "category": ["Fuel", "Transport", "Tools", "Food", "Safety"][index % 5],
                    "amount": expense_amount,
                    "vendor_name": vendors[index % len(vendors)].name,
                    "payment_mode": ["Cash", "UPI", "Bank Transfer"][index % 3],
                    "receipt_number": f"RCPT-{index + 5001}",
                    "notes": "Demo loss pressure entry for dashboard visibility." if index in demo_loss_expenses else "Demo expense waiting for cost review.",
                    "approval_status": ["pending", "approved", "rejected"][index % 3],
                    "created_by": users[index % len(users)],
                },
            )

            demo_loss_receipts = {
                3: Decimal("420000"),
                6: Decimal("610000"),
            }
            Payment.objects.update_or_create(
                project=project,
                payment_date=today - timedelta(days=index * 2 + 5),
                reference_number=f"PAY-IN-{index + 2001}",
                defaults={
                    "payment_type": Payment.PaymentType.INCOMING,
                    "amount": demo_loss_receipts.get(index, Decimal(str(900000 + index * 175000))),
                    "received_from": project.client_name,
                    "due_date": today + timedelta(days=20 + index),
                    "notes": "Lower collection demo entry to show project loss." if index in demo_loss_receipts else "Client milestone receipt.",
                    "created_by": owner,
                },
            )
            Payment.objects.update_or_create(
                project=project,
                payment_date=today - timedelta(days=index * 2 + 4),
                reference_number=f"PAY-OUT-{index + 3001}",
                defaults={
                    "payment_type": Payment.PaymentType.OUTGOING,
                    "amount": Decimal(str(210000 + index * 42000)),
                    "received_from": vendors[index % len(vendors)].name,
                    "due_date": today + timedelta(days=12 + index),
                    "notes": "Vendor or contractor payout.",
                    "created_by": users[-1],
                },
            )

            ApprovalRequest.objects.update_or_create(
                project=project,
                module_name="Expenses",
                record_id=expense.id,
                request_type="Site Expense Approval",
                defaults={
                    "requested_by": users[index % len(users)],
                    "approved_by": owner if index % 3 else None,
                    "status": ["pending", "approved", "pending", "rejected"][index % 4],
                    "amount": expense.amount,
                    "remarks": "Demo approval item for decision queue.",
                },
            )

        quotation_statuses = ["draft", "sent", "approved", "converted", "rejected", "sent", "approved", "draft"]
        for index, project in enumerate(projects):
            subtotal = Decimal(str(750000 + index * 215000))
            gst = subtotal * Decimal("0.18")
            margin = subtotal * Decimal("0.12")
            total_amount = subtotal + gst + margin
            advance_amount = total_amount * Decimal("0.25")
            quotation, _ = Quotation.objects.update_or_create(
                quotation_number=f"QT-DEMO-{index + 1001}",
                defaults={
                    "project_name": project.name,
                    "client_name": project.client_name,
                    "client_phone": f"98765{index + 41000}",
                    "client_email": f"client{index + 1}@example.com",
                    "site_contact_name": f"Site Contact {index + 1}",
                    "location": project.location,
                    "description": "Demo quotation with civil, material, and finishing line items.",
                    "quotation_date": today - timedelta(days=25 - index),
                    "valid_until": today + timedelta(days=20 + index),
                    "work_duration": f"{90 + index * 10} days from work order",
                    "payment_terms": "25% advance, 50% during execution, and 25% before handover.",
                    "status": quotation_statuses[index],
                    "subtotal": subtotal,
                    "gst_percent": Decimal("18"),
                    "gst_amount": gst,
                    "profit_margin_percent": Decimal("12"),
                    "profit_margin_amount": margin,
                    "total_amount": total_amount,
                    "advance_amount": advance_amount,
                    "balance_amount": total_amount - advance_amount,
                    "notes": "Prepared for client review.",
                    "converted_project": project if quotation_statuses[index] == "converted" else None,
                    "created_by": owner,
                },
            )
            for line_index, description in enumerate(["Civil works", "Material supply", "Finishing package"]):
                quantity = Decimal(str(10 + line_index * 4 + index))
                unit_rate = Decimal(str(18000 + line_index * 6500 + index * 500))
                QuotationLineItem.objects.update_or_create(
                    quotation=quotation,
                    description=description,
                    defaults={
                        "category": ["Civil", "Materials", "Finishing"][line_index],
                        "quantity": quantity,
                        "unit": ["lot", "ton", "sqft"][line_index],
                        "unit_rate": unit_rate,
                        "line_total": quantity * unit_rate,
                    },
                )

        for index, material in enumerate(materials):
            BOQ.objects.update_or_create(
                item_name=f"{material.name} BOQ",
                defaults={
                    "category": material.category or "General",
                    "quantity": Decimal(str(100 + index * 25)),
                    "unit": material.unit[:20],
                    "unit_rate": material.default_rate,
                },
            )

        equipment_rows = [
            ("Tower Crane TC-01", "Lifting", 18500, "in_use"),
            ("Concrete Mixer CM-04", "Concrete", 3500, "available"),
            ("JCB 3DX", "Earthwork", 12500, "in_use"),
            ("Plate Compactor", "Compaction", 2200, "maintenance"),
            ("Scaffolding Set A", "Access", 4800, "available"),
            ("Boom Lift BL-02", "Access", 9800, "in_use"),
            ("Diesel Generator 62kVA", "Power", 6200, "available"),
            ("Water Pump WP-07", "Utility", 1800, "maintenance"),
        ]
        for name, equipment_type, daily_cost, status in equipment_rows:
            Equipment.objects.update_or_create(
                name=name,
                defaults={
                    "equipment_type": equipment_type,
                    "daily_cost": Decimal(str(daily_cost)),
                    "status": status,
                },
            )

        po_statuses = ["pending", "approved", "received", "cancelled", "pending", "approved"]
        for index, vendor in enumerate(vendors):
            PurchaseOrder.objects.update_or_create(
                po_number=f"PO-DEMO-{index + 7001}",
                defaults={
                    "vendor": vendor,
                    "total_amount": Decimal(str(145000 + index * 54000)),
                    "status": po_statuses[index % len(po_statuses)],
                },
            )

        self.stdout.write(self.style.SUCCESS("Demo data seeded. Login: owner@charlescrm.local / admin123"))
