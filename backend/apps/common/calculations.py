from decimal import Decimal, ROUND_HALF_UP


MONEY_PLACES = Decimal("0.01")


def to_money(value):
    return Decimal(value or 0).quantize(MONEY_PLACES, rounding=ROUND_HALF_UP)


def line_total(quantity, unit_rate):
    return to_money(Decimal(quantity or 0) * Decimal(unit_rate or 0))


def labor_total(attendance_days, wage_per_day, overtime_amount=0):
    base_amount = Decimal(attendance_days or 0) * Decimal(wage_per_day or 0)
    return to_money(base_amount + Decimal(overtime_amount or 0))


def closing_balance(opening_balance, cash_in, cash_out):
    return to_money(Decimal(opening_balance or 0) + Decimal(cash_in or 0) - Decimal(cash_out or 0))
