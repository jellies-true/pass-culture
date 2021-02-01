import pytest

from pcapi.emails.offerer_ongoing_attachment import retrieve_data_for_offerer_ongoing_attachment_email
from pcapi.model_creators.generic_creators import create_offerer
from pcapi.model_creators.generic_creators import create_user
from pcapi.model_creators.generic_creators import create_user_offerer
from pcapi.repository import repository


@pytest.mark.usefixtures("db_session")
class ProOffererAttachmentValidationEmailTest:
    def test_should_return_data(self):
        # Given
        offerer = create_offerer(name="Le Théâtre SAS")
        pro_user = create_user(email="pro@example.com")
        user_offerer = create_user_offerer(pro_user, offerer)

        repository.save(user_offerer)

        # When
        offerer_attachment_validation_email = retrieve_data_for_offerer_ongoing_attachment_email(user_offerer)

        # Then
        assert offerer_attachment_validation_email == {
            "MJ-TemplateID": 778749,
            "MJ-TemplateLanguage": True,
            "Vars": {"nom_structure": "Le Théâtre SAS"},
        }
