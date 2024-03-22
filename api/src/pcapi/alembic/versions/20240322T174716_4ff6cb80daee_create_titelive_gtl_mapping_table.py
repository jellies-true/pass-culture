"""Create titelive gtl mapping table
"""

from alembic import op
import sqlalchemy as sa

from pcapi.core.offers.models import TiteliveGtlType
from pcapi.utils.db import MagicEnum


# pre/post deployment: pre
# revision identifiers, used by Alembic.
revision = "4ff6cb80daee"
down_revision = "5c90621be933"


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "titelive_gtl_mapping",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("gtlType", MagicEnum(TiteliveGtlType), nullable=False),
        sa.Column("gtlId", sa.Text(), nullable=True),
        sa.Column("gtlLabelLevel1", sa.Text(), nullable=True),
        sa.Column("gtlLabelLevel2", sa.Text(), nullable=True),
        sa.Column("gtlLabelLevel3", sa.Text(), nullable=True),
        sa.Column("gtlLabelLevel4", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.get_context().autocommit_block():
        op.create_index(
            "gtl_type_idx",
            "titelive_gtl_mapping",
            ["gtlType"],
            postgresql_concurrently=True,
            unique=False,
            if_not_exists=True,
            postgresql_using="hash",
        )
        op.create_index(
            op.f("ix_titelive_gtl_mapping_gtlId"),
            "titelive_gtl_mapping",
            ["gtlId"],
            postgresql_concurrently=True,
            if_not_exists=True,
            unique=False,
        )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    with op.get_context().autocommit_block():
        op.drop_index(
            op.f("ix_titelive_gtl_mapping_gtlId"),
            table_name="titelive_gtl_mapping",
            postgresql_concurrently=True,
            if_exists=True,
        )
        op.drop_index(
            "gtl_type_idx",
            table_name="titelive_gtl_mapping",
            postgresql_using="hash",
            postgresql_concurrently=True,
            if_exists=True,
        )
    op.drop_table("titelive_gtl_mapping")
    # ### end Alembic commands ###
