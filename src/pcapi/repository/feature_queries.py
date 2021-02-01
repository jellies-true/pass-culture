from pcapi.models.api_errors import ResourceNotFoundError
from pcapi.models.feature import Feature
from pcapi.models.feature import FeatureToggle


def find_all():
    return Feature.query.all()


def is_active(feature_toggle: FeatureToggle) -> bool:
    if not isinstance(feature_toggle, FeatureToggle):
        raise ResourceNotFoundError
    return Feature.query.filter_by(name=feature_toggle.name).first().isActive
