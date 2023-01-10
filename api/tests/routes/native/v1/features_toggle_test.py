import pytest

from pcapi.core.testing import override_features
from pcapi.models.feature import Feature


pytestmark = pytest.mark.usefixtures("db_session")


class FeaturesToggleTest:
    @override_features(ENABLE_NATIVE_APP_RECAPTCHA=False)
    def toggle_feature_flags(self, client):
        response = client.patch(
            "/native/v1/features",
            json={
                "features": [
                    {
                        "name": "ENABLE_NATIVE_APP_RECAPTCHA",
                        "isActive": True,
                    }
                ]
            },
        )

        assert response.status_code == 204
        feature = Feature.query.filter_by(name="ENABLE_NATIVE_APP_RECAPTCHA").one()
        assert feature.isActive
