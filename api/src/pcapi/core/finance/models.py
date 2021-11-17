"""Finance-related models.

In all models, the amount is in euro cents. It is signed:
- a negative amount will be outgoing (payable by us to someone);
- a positive amount will be incoming (payable to us by someone).
"""

import enum

import sqlalchemy as sqla
import sqlalchemy.dialects.postgresql as sqla_psql
import sqlalchemy.orm as sqla_orm

from pcapi.models.db import Model
import pcapi.utils.db as db_utils


class PricingStatus(enum.Enum):
    PENDING = "pending"
    CANCELLED = "cancelled"
    VALIDATED = "validated"
    REJECTED = "rejected"
    BILLED = "billed"


CANCELLABLE_PRICING_STATUSES = {PricingStatus.PENDING, PricingStatus.VALIDATED, PricingStatus.REJECTED}
DELETABLE_PRICING_STATUSES = CANCELLABLE_PRICING_STATUSES | {PricingStatus.CANCELLED}


class PricingLineCategory(enum.Enum):
    OFFERER_REVENUE = "offerer revenue"
    OFFERER_CONTRIBUTION = "offerer contribution"
    PASS_CULTURE_COMMISSION = "pass culture commission"


class PricingLogReason(enum.Enum):
    MARK_AS_UNUSED = "mark as unused"


class Frequency(enum.Enum):
    EVERY_TWO_WEEKS = "every two weeks"


class CashflowStatus(enum.Enum):
    # A cashflow starts by being pending, i.e. it's waiting for being
    # sent to our accounting system.
    PENDING = "pending"
    # Then it is sent to our accounting system for review.
    UNDER_REVIEW = "under review"
    # And it's finally sent to the bank. By default, we decide it's
    # accepted. The bank will inform us later if it rejected the
    # cashflow. (For now, this happens outside of this application,
    # which is why there is no "rejected" status below for now.)
    ACCEPTED = "accepted"


class BusinessUnit(Model):
    id = sqla.Column(sqla.BigInteger, primary_key=True, autoincrement=True)
    name = sqla.Column(sqla.Text)
    siret = sqla.Column(sqla.String(14), unique=True)

    bankAccountId = sqla.Column(sqla.BigInteger, sqla.ForeignKey("bank_information.id"), index=True, nullable=True)
    bankAccount = sqla_orm.relationship("BankInformation", foreign_keys=[bankAccountId])

    cashflowFrequency = sqla.Column(db_utils.MagicEnum(Frequency), nullable=False, default=Frequency.EVERY_TWO_WEEKS)
    invoiceFrequency = sqla.Column(db_utils.MagicEnum(Frequency), nullable=False, default=Frequency.EVERY_TWO_WEEKS)


class Pricing(Model):
    id = sqla.Column(sqla.BigInteger, primary_key=True, autoincrement=True)

    status = sqla.Column(db_utils.MagicEnum(PricingStatus), index=True, nullable=False)

    bookingId = sqla.Column(sqla.BigInteger, sqla.ForeignKey("booking.id"), index=True, nullable=False)
    booking = sqla_orm.relationship("Booking", foreign_keys=[bookingId], backref="pricings")
    businessUnitId = sqla.Column(sqla.BigInteger, sqla.ForeignKey("business_unit.id"), index=True, nullable=False)
    businessUnit = sqla_orm.relationship("BusinessUnit", foreign_keys=[businessUnitId])

    creationDate = sqla.Column(sqla.DateTime, nullable=False, server_default=sqla.func.now())
    # valueDate is `Booking.dateUsed` but it's useful to denormalize
    # it here: many queries use this column and we thus avoid a JOIN.
    valueDate = sqla.Column(sqla.DateTime, nullable=False)

    # See the note about `amount` at the beginning of this module.
    # The amount is zero for bookings that are not reimbursable. We do
    # create 0-pricings for these bookings to avoid processing them
    # again and again.
    amount = sqla.Column(sqla.Integer, nullable=False)
    # See constraints below about the relationship between rate,
    # standardRule and customRuleId.
    standardRule = sqla.Column(sqla.Text, nullable=False)
    customRuleId = sqla.Column(
        sqla.BigInteger, sqla.ForeignKey("custom_reimbursement_rule.id"), index=True, nullable=True
    )
    customRule = sqla_orm.relationship("CustomReimbursementRule", foreign_keys=[customRuleId])

    # Revenue is in euro cents. It's the revenue of the business unit
    # as of `pricing.valueDate` (thus including the related booking).
    # It is zero or positive.
    revenue = sqla.Column(sqla.Integer, nullable=False)

    cashflows = sqla_orm.relationship("Cashflow", secondary="cashflow_pricing", back_populates="pricings")
    lines = sqla_orm.relationship("PricingLine", back_populates="pricing", order_by="PricingLine.id")
    logs = sqla_orm.relationship("PricingLog", back_populates="pricing")

    __table_args__ = (
        sqla.Index("idx_uniq_booking_id", bookingId, postgresql_where=status != PricingStatus.CANCELLED, unique=True),
        sqla.CheckConstraint(
            """
            (
              "standardRule" = ''
              AND "customRuleId" IS NOT NULL
            ) OR (
              "standardRule" != ''
              AND "customRuleId" IS NULL
            )
            """,
            name="reimbursement_rule_constraint_check",
        ),
    )


class PricingLine(Model):
    id = sqla.Column(sqla.BigInteger, primary_key=True, autoincrement=True)

    pricingId = sqla.Column(sqla.BigInteger, sqla.ForeignKey("pricing.id"), nullable=True)
    pricing = sqla_orm.relationship("Pricing", foreign_keys=[pricingId], back_populates="lines")

    # See the note about `amount` at the beginning of this module.
    amount = sqla.Column(sqla.Integer, nullable=False)

    category = sqla.Column(db_utils.MagicEnum(PricingLineCategory), nullable=False)


class PricingLog(Model):
    """A pricing log is created whenever the status of a pricing
    changes.
    """

    id = sqla.Column(sqla.BigInteger, primary_key=True, autoincrement=True)

    pricingId = sqla.Column(sqla.BigInteger, sqla.ForeignKey("pricing.id"), index=True, nullable=False)
    pricing = sqla_orm.relationship("Pricing", foreign_keys=[pricingId], back_populates="logs")

    timestamp = sqla.Column(sqla.DateTime, nullable=False, server_default=sqla.func.now())
    statusBefore = sqla.Column(db_utils.MagicEnum(PricingStatus), nullable=False)
    statusAfter = sqla.Column(db_utils.MagicEnum(PricingStatus), nullable=False)
    reason = sqla.Column(db_utils.MagicEnum(PricingLogReason), nullable=False)


class Cashflow(Model):
    """A cashflow represents a specific amount money that is transferred
    between us and a third party. It may be outgoing or incoming.

    By definition a cashflow cannot be zero.
    """

    id = sqla.Column(sqla.BigInteger, primary_key=True, autoincrement=True)
    creationDate = sqla.Column(sqla.DateTime, nullable=False, server_default=sqla.func.now())
    status = sqla.Column(db_utils.MagicEnum(CashflowStatus), index=True, nullable=False)

    bankAccountId = sqla.Column(sqla.BigInteger, sqla.ForeignKey("bank_information.id"), index=True, nullable=False)
    bankAccount = sqla_orm.relationship("BankInformation", foreign_keys=[bankAccountId])

    batchId = sqla.Column(sqla.BigInteger, sqla.ForeignKey("cashflow_batch.id"), nullable=False)

    # See the note about `amount` at the beginning of this module.
    # The amount cannot be zero.
    # For now, only negative (outgoing) cashflows are automatically
    # generated. Positive (incoming) cashflows are manually created.
    amount = sqla.Column(sqla.Integer, nullable=False)

    # The transaction id is a UUID that will be included in the wire
    # transfer file that is sent to the bank.
    transactionId = sqla.Column(
        sqla_psql.UUID(as_uuid=True), nullable=False, unique=True, server_default=sqla.func.gen_random_uuid()
    )

    logs = sqla_orm.relationship("CashflowLog", back_populates="cashflow", order_by="CashflowLog.timestamp")
    pricings = sqla_orm.relationship("Pricing", secondary="cashflow_pricing", back_populates="cashflows")

    __table_args__ = (sqla.CheckConstraint('("amount" != 0)', name="non_zero_amount_check"),)


class CashflowLog(Model):
    """A cashflow log is created whenever the status of a cashflow
    changes.
    """

    id = sqla.Column(sqla.BigInteger, primary_key=True, autoincrement=True)
    cashflowId = sqla.Column(sqla.BigInteger, sqla.ForeignKey("cashflow.id"), index=True, nullable=False)
    cashflow = sqla_orm.relationship("Cashflow", foreign_keys=[cashflowId], back_populates="logs")
    timestamp = sqla.Column(sqla.DateTime, nullable=False, server_default=sqla.func.now())
    statusBefore = sqla.Column(db_utils.MagicEnum(CashflowStatus), nullable=False)
    statusAfter = sqla.Column(db_utils.MagicEnum(CashflowStatus), nullable=False)
    details = sqla.Column(db_utils.SafeJsonB, nullable=True, default={}, server_default="{}")


class CashflowPricing(Model):
    """An association table between cashflows and pricings for their
    many-to-many relationship.

    A cashflow is "naturally" linked to multiple pricings of the same
    business unit: we build a cashflow based on all pricings of a
    given period (e.g. two weeks).

    A pricing may also be linked to multiple cashflows: for example,
    if a cashflow is rejected by the bank because the bank information
    are wrong, we will create another cashflow and the pricing will
    thus be linked to two cashflows.
    """

    cashflowId = sqla.Column(sqla.BigInteger, sqla.ForeignKey("cashflow.id"), index=True, primary_key=True)
    pricingId = sqla.Column(sqla.BigInteger, sqla.ForeignKey("pricing.id"), index=True, primary_key=True)

    __table_args__ = (
        sqla.UniqueConstraint(
            "cashflowId",
            "pricingId",
            name="unique_cashflow_pricing_association",
        ),
    )


class CashflowBatch(Model):
    """A cashflow batch groups cashflows that are sent to the bank at the
    same time (in a single file).
    """

    id = sqla.Column(sqla.BigInteger, primary_key=True, autoincrement=True)
    creationDate = sqla.Column(sqla.DateTime, nullable=False, server_default=sqla.func.now())
    cutoff = sqla.Column(sqla.DateTime, nullable=False, unique=True)
