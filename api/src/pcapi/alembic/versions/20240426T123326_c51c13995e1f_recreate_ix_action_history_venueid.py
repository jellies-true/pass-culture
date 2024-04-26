"""Recreate index: ix_action_history_venueId, with condition: not null
"""

from alembic import op
import sqlalchemy as sa

from pcapi import settings


# pre/post deployment: post
# revision identifiers, used by Alembic.
revision = "c51c13995e1f"
down_revision = "cf70cfe76aa4"
branch_labels: tuple[str] | None = None
depends_on: list[str] | None = None


def upgrade() -> None:
    with op.get_context().autocommit_block():
        op.execute("SET SESSION statement_timeout='300s'")
        op.create_index(
            "ix_action_history_venueId",
            "action_history",
            ["venueId"],
            unique=False,
            postgresql_where=sa.text('"venueId" IS NOT NULL'),
            postgresql_concurrently=True,
            if_not_exists=True,
        )
        op.execute(f"SET SESSION statement_timeout={settings.DATABASE_STATEMENT_TIMEOUT}")


def downgrade() -> None:
    with op.get_context().autocommit_block():
        op.drop_index(
            "ix_action_history_venueId",
            table_name="action_history",
            postgresql_where=sa.text('"venueId" IS NOT NULL'),
            postgresql_concurrently=True,
            if_exists=True,
        )
