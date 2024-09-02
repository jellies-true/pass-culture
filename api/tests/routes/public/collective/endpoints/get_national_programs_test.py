import pytest

import pcapi.core.educational.factories as educational_factories

from tests.routes.public.helpers import PublicAPIEndpointBaseHelper


@pytest.mark.usefixtures("db_session")
class GetNationalProgramsTest(PublicAPIEndpointBaseHelper):
    endpoint_url = "/v2/collective/national-programs/"
    endpoint_method = "get"

    def test_list_national_programs(self, client):
        plain_api_key, _ = self.setup_provider()
        programs = educational_factories.NationalProgramFactory.create_batch(2)

        response = client.with_explicit_token(plain_api_key).get(self.endpoint_url)

        assert response.status_code == 200

        program_names = {program["name"] for program in response.json}
        assert program_names == {program.name for program in programs}