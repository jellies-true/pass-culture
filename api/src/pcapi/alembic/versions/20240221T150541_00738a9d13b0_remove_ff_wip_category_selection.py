"""
remove ff WIP_CATEGORY_SELECTION
"""

# pre/post deployment: post
# revision identifiers, used by Alembic.
revision = "00738a9d13b0"
down_revision = "04c2660a8169"
branch_labels = None
depends_on = None


def get_flag():  # type: ignore[no-untyped-def]
    # Do not import `pcapi.models.feature` at module-level. It breaks
    # `alembic history` with a SQLAlchemy error that complains about
    # an unknown table name while initializing the ORM mapper.
    from pcapi.models import feature

    return feature.Feature(
        name="WIP_CATEGORY_SELECTION",
        isActive=False,
        description="Activer la nouvelle sélection de catégories",
    )


def upgrade() -> None:
    from pcapi.models import feature

    feature.remove_feature_from_database(get_flag())


def downgrade() -> None:
    from pcapi.models import feature

    feature.add_feature_to_database(get_flag())
