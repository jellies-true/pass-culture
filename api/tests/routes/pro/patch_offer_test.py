from datetime import datetime
from decimal import Decimal
from unittest.mock import patch

import pytest

from pcapi.connectors import api_adresse
import pcapi.core.bookings.factories as bookings_factories
from pcapi.core.categories import subcategories_v2 as subcategories
import pcapi.core.mails.testing as mails_testing
import pcapi.core.offerers.factories as offerers_factories
import pcapi.core.offers.factories as offers_factories
from pcapi.core.offers.models import Offer
from pcapi.core.offers.models import OfferValidationStatus
from pcapi.core.offers.models import WithdrawalTypeEnum
import pcapi.core.providers.factories as providers_factories
from pcapi.core.providers.repository import get_provider_by_local_class
from pcapi.core.testing import assert_num_queries
from pcapi.core.testing import override_features
import pcapi.core.users.factories as users_factories
from pcapi.utils.date import format_into_utc_date


pytestmark = pytest.mark.usefixtures("db_session")


class Returns200Test:
    def test_patch_offer(self, client):
        # Given
        user_offerer = offerers_factories.UserOffererFactory(user__email="user@example.com")
        venue = offerers_factories.VirtualVenueFactory(managingOfferer=user_offerer.offerer)
        offer = offers_factories.OfferFactory(
            subcategoryId=subcategories.ABO_PLATEFORME_VIDEO.id,
            venue=venue,
            name="New name",
            url="test@test.com",
            description="description",
        )

        # When
        data = {
            "name": "New name",
            "externalTicketOfficeUrl": "http://example.net",
            "mentalDisabilityCompliant": True,
        }
        response = client.with_session_auth("user@example.com").patch(f"/offers/{offer.id}", json=data)

        # Then
        assert response.status_code == 200
        assert response.json["id"] == offer.id
        assert response.json["venue"]["id"] == offer.venue.id

        updated_offer = Offer.query.get(offer.id)
        assert updated_offer.name == "New name"
        assert updated_offer.externalTicketOfficeUrl == "http://example.net"
        assert updated_offer.mentalDisabilityCompliant
        assert updated_offer.subcategoryId == subcategories.ABO_PLATEFORME_VIDEO.id
        assert not updated_offer.product

    def test_patch_offer_with_extra_data_should_not_remove_extra_data(self, client):
        user_offerer = offerers_factories.UserOffererFactory(user__email="user@example.com")
        venue = offerers_factories.VenueFactory(managingOfferer=user_offerer.offerer)
        offer = offers_factories.OfferFactory(
            subcategoryId=subcategories.LIVRE_PAPIER.id,
            venue=venue,
            extraData={"gtl_id": "01010101", "author": "Kewis Larol"},
        )

        data = {
            "name": "New name",
            "mentalDisabilityCompliant": True,
        }
        response = client.with_session_auth("user@example.com").patch(f"/offers/{offer.id}", json=data)

        assert response.status_code == 200
        assert response.json["id"] == offer.id
        assert response.json["venue"]["id"] == offer.venue.id

        updated_offer = Offer.query.get(offer.id)
        assert updated_offer.extraData["gtl_id"] == "01010101"
        assert updated_offer.extraData["author"] == "Kewis Larol"
        assert updated_offer.mentalDisabilityCompliant
        assert updated_offer.subcategoryId == subcategories.LIVRE_PAPIER.id
        assert not updated_offer.product

    @override_features(WIP_EAN_CREATION=True)
    def test_patch_offer_with_product_with_same_ean(self, client):
        user_offerer = offerers_factories.UserOffererFactory(user__email="user@example.com")
        venue = offerers_factories.VirtualVenueFactory(managingOfferer=user_offerer.offerer)
        product = offers_factories.ProductFactory(
            subcategoryId=subcategories.LIVRE_PAPIER.id,
            extraData={"ean": "1111111111111"},
            name="New name",
            description="description",
        )
        offer = offers_factories.OfferFactory(
            venue=venue,
            url="test@test.com",
            product=product,
        )

        data = {"extraData": {"ean": "1111111111111"}}
        response = client.with_session_auth("user@example.com").patch(f"/offers/{offer.id}", json=data)

        assert response.status_code == 200
        assert response.json["id"] == offer.id

        updated_offer = Offer.query.get(offer.id)
        assert updated_offer.extraData == {"ean": "1111111111111"}

    def test_patch_offer_with_provider_extra_data(self, client):
        user_offerer = offerers_factories.UserOffererFactory(user__email="user@example.com")
        venue = offerers_factories.VenueFactory(managingOfferer=user_offerer.offerer)
        ems_provider = get_provider_by_local_class("EMSStocks")
        venue_provider = providers_factories.VenueProviderFactory(provider=ems_provider, venue=venue)
        allocine_provider = providers_factories.AllocineProviderFactory(venue=venue_provider.venue)
        offer = offers_factories.OfferFactory(
            name="Film",
            venue=venue,
            lastProvider=allocine_provider,
            subcategoryId=subcategories.SEANCE_CINE.id,
            isDuo=False,
            description="description",
            extraData={
                "cast": ["Joan Baez", "Joe Cocker", "David Crosby"],
                "eidr": "10.5240/ADBD-3CAA-43A0-7BF0-86E2-K",
                "type": "FEATURE_FILM",
                "visa": "37205",
                "title": "Woodstock",
                "genres": ["DOCUMENTARY", "HISTORICAL", "MUSIC"],
                "credits": [
                    {"person": {"lastName": "Wadleigh", "firstName": "Michael"}, "position": {"name": "DIRECTOR"}}
                ],
                "runtime": 185,
                "theater": {"allocine_room_id": "W0135", "allocine_movie_id": 2634},
                "backlink": "https://www.allocine.fr/film/fichefilm_gen_cfilm=2634.html",
                "synopsis": "Le plus important rassemblement de la musique pop de ces vingt derni\u00e8res ann\u00e9es. Des groupes qui ont marqu\u00e9 leur \u00e9poque et une jeunesse qui a marqu\u00e9 la sienne.",
                "companies": [{"name": "Wadleigh-Maurice", "activity": "Production"}],
                "countries": ["USA"],
                "posterUrl": "https://fr.web.img2.acsta.net/pictures/14/06/20/12/25/387023.jpg",
                "allocineId": 2634,
                "originalTitle": "Woodstock",
                "stageDirector": "Michael Wadleigh",
                "productionYear": 1970,
            },
        )

        data = {
            "name": "New name",
            "externalTicketOfficeUrl": "http://example.net",
            "extraData": {
                "cast": ["Joan Baez", "Joe Cocker", "David Crosby"],
                "eidr": "10.5240/ADBD-3CAA-43A0-7BF0-86E2-K",
                "type": "FEATURE_FILM",
                "visa": "37205",
                "title": "Woodstock",
                "genres": ["DOCUMENTARY", "HISTORICAL", "MUSIC"],
                "credits": [
                    {"person": {"lastName": "Wadleigh", "firstName": "Michael"}, "position": {"name": "DIRECTOR"}}
                ],
                "runtime": 185,
                "theater": {"allocine_room_id": "W0135", "allocine_movie_id": 2634},
                "backlink": "https://www.allocine.fr/film/fichefilm_gen_cfilm=2634.html",
                "synopsis": "Le plus important rassemblement de la musique pop de ces vingt derni\u00e8res ann\u00e9es. Des groupes qui ont marqu\u00e9 leur \u00e9poque et une jeunesse qui a marqu\u00e9 la sienne.",
                "companies": [{"name": "Wadleigh-Maurice", "activity": "Production"}],
                "countries": ["USA"],
                "posterUrl": "https://fr.web.img2.acsta.net/pictures/14/06/20/12/25/387023.jpg",
                "allocineId": 2634,
                "originalTitle": "Woodstock",
                "stageDirector": "Michael Wadleigh",
                "productionYear": 1970,
            },
        }
        response = client.with_session_auth("user@example.com").patch(f"/offers/{offer.id}", json=data)

        assert response.status_code == 200
        assert response.json["id"] == offer.id

        updated_offer = Offer.query.get(offer.id)
        assert updated_offer.name == "New name"
        assert updated_offer.extraData == {
            "cast": ["Joan Baez", "Joe Cocker", "David Crosby"],
            "eidr": "10.5240/ADBD-3CAA-43A0-7BF0-86E2-K",
            "type": "FEATURE_FILM",
            "visa": "37205",
            "title": "Woodstock",
            "genres": ["DOCUMENTARY", "HISTORICAL", "MUSIC"],
            "credits": [{"person": {"lastName": "Wadleigh", "firstName": "Michael"}, "position": {"name": "DIRECTOR"}}],
            "runtime": 185,
            "theater": {"allocine_room_id": "W0135", "allocine_movie_id": 2634},
            "backlink": "https://www.allocine.fr/film/fichefilm_gen_cfilm=2634.html",
            "synopsis": "Le plus important rassemblement de la musique pop de ces vingt derni\u00e8res ann\u00e9es. Des groupes qui ont marqu\u00e9 leur \u00e9poque et une jeunesse qui a marqu\u00e9 la sienne.",
            "companies": [{"name": "Wadleigh-Maurice", "activity": "Production"}],
            "countries": ["USA"],
            "posterUrl": "https://fr.web.img2.acsta.net/pictures/14/06/20/12/25/387023.jpg",
            "allocineId": 2634,
            "originalTitle": "Woodstock",
            "stageDirector": "Michael Wadleigh",
            "productionYear": 1970,
        }

    @pytest.mark.parametrize(
        "label, offer_has_oa, address_update_exist",
        [
            ["label", True, True],
            ["label", False, True],
            ["label", False, False],
            ["label", True, False],
            [None, True, True],
            [None, False, True],
            [None, False, False],
            [None, True, False],
        ],
    )
    @patch("pcapi.connectors.api_adresse.get_address")
    def test_patch_offer_with_address(self, get_address_mock, label, offer_has_oa, address_update_exist, client):
        # Given
        user_offerer = offerers_factories.UserOffererFactory(user__email="user@example.com")
        venue = offerers_factories.VenueFactory(managingOfferer=user_offerer.offerer)
        oa = None
        if offer_has_oa:
            oa = offerers_factories.OffererAddressFactory(offerer=user_offerer.offerer)
        offer = offers_factories.OfferFactory(
            subcategoryId=subcategories.ABO_MEDIATHEQUE.id,
            venue=venue,
            name="New name",
            description="description",
            offererAddress=oa,
        )
        if address_update_exist:
            existant_oa = offerers_factories.OffererAddressFactory(
                offerer=user_offerer.offerer,
                label=label,
                address__street="1 rue de la paix",
                address__city="Paris",
                address__banId="75102_7560_00001",
                address__postalCode="75102",
                address__latitude=48.8566,
                address__longitude=2.3522,
            )

        # When
        data = {
            "name": "New name",
            "externalTicketOfficeUrl": "http://example.net",
            "mentalDisabilityCompliant": True,
            "address": {
                "street": "1 rue de la paix",
                "city": "Paris",
                "postalCode": "75102",
                "latitude": 48.8566,
                "longitude": 2.3522,
                "label": label,
            },
        }
        get_address_mock.return_value = api_adresse.AddressInfo(
            street="1 rue de la paix",
            city="Paris",
            citycode="75102",
            postcode="75102",
            latitude=48.8566,
            longitude=2.3522,
            score=0.9,
            id="75102_7560_00001",
            label=label if label else "",
        )
        response = client.with_session_auth("user@example.com").patch(f"/offers/{offer.id}", json=data)

        assert response.status_code == 200
        assert response.json["id"] == offer.id
        updated_offer = Offer.query.get(offer.id)
        address = updated_offer.offererAddress.address
        if address_update_exist:
            assert updated_offer.offererAddress == existant_oa
        assert updated_offer.offererAddress.label == label
        assert address.street == "1 rue de la paix"
        assert address.city == "Paris"
        assert address.postalCode == "75102"
        assert address.latitude == Decimal("48.85660")
        assert address.longitude == Decimal("2.3522")
        assert address.isManualEdition is False

    @patch("pcapi.connectors.api_adresse.get_address")
    def test_user_can_link_offer_to_the_offerer_address_of_venue(self, get_address_mock, client):
        user_offerer = offerers_factories.UserOffererFactory(user__email="user@example.com")
        venue = offerers_factories.VenueFactory(managingOfferer=user_offerer.offerer)
        offer = offers_factories.OfferFactory(
            subcategoryId=subcategories.ABO_MEDIATHEQUE.id,
            venue=venue,
            name="New name",
            description="description",
            offererAddress=None,
        )
        data = {
            "address": {
                "isVenueAddress": True,
                "street": venue.offererAddress.address.street,
                "city": venue.offererAddress.address.city,
                "postalCode": venue.offererAddress.address.postalCode,
                "latitude": venue.offererAddress.address.latitude,
                "longitude": venue.offererAddress.address.longitude,
            },
        }
        offer_id = offer.id
        http_client = client.with_session_auth("user@example.com")
        with assert_num_queries(12):
            response = http_client.patch(f"/offers/{offer_id}", json=data)
        get_address_mock.assert_not_called()

        assert response.status_code == 200
        assert response.json["id"] == offer.id
        updated_offer = Offer.query.get(offer.id)
        assert offer.offererAddressId == venue.offererAddressId

    @patch("pcapi.connectors.api_adresse.get_municipality_centroid")
    def test_patch_offer_with_manual_address_edition(self, mocked_get_centroid, client):
        # Given
        user_offerer = offerers_factories.UserOffererFactory(user__email="user@example.com")
        venue = offerers_factories.VenueFactory(managingOfferer=user_offerer.offerer)
        offer = offers_factories.OfferFactory(
            subcategoryId=subcategories.RENCONTRE.id,
            venue=venue,
            name="New name",
            description="description",
        )
        mocked_get_centroid.return_value = api_adresse.AddressInfo(
            id="98826",
            label="Poum",
            postcode="98826",
            citycode="98826",
            latitude=-20.203,
            longitude=164.073,
            score=0.9371472727272726,
            city="Poum",
            street=None,
        )

        # When
        data = {
            "name": "Visite des Marais Salins de Kô",
            "externalTicketOfficeUrl": "http://example.net",
            "mentalDisabilityCompliant": True,
            "address": {
                "street": "3, Chemin de la Plage",
                "city": "Poum, Tiabet",
                "postalCode": "98826",
                "latitude": -20.08521415490879,
                "longitude": 164.03239215718415,
                "label": "Marais Salins de Kô",
                "isManualEdition": True,
            },
        }

        response = client.with_session_auth("user@example.com").patch(f"/offers/{offer.id}", json=data)

        assert response.status_code == 200
        assert response.json["id"] == offer.id
        updated_offer = Offer.query.get(offer.id)
        address = updated_offer.offererAddress.address
        assert updated_offer.offererAddress.label == "Marais Salins de Kô"
        assert address.street == data["address"]["street"]
        assert address.city == data["address"]["city"]
        assert address.postalCode == data["address"]["postalCode"]
        assert address.inseeCode == "98826"
        assert address.latitude == Decimal("-20.08521")
        assert address.longitude == Decimal("164.03239")
        assert address.isManualEdition is True

    @patch("pcapi.connectors.api_adresse.get_municipality_centroid")
    def test_unknown_result_from_api_adresse_doesnt_block_offer_creation(self, mocked_get_centroid, client):
        # Given
        user_offerer = offerers_factories.UserOffererFactory(user__email="user@example.com")
        venue = offerers_factories.VenueFactory(managingOfferer=user_offerer.offerer)
        offer = offers_factories.OfferFactory(
            subcategoryId=subcategories.RENCONTRE.id,
            venue=venue,
            name="New name",
            description="description",
        )
        mocked_get_centroid.side_effect = api_adresse.NoResultException
        # When
        data = {
            "name": "Visite des Marais Salins de Kô",
            "externalTicketOfficeUrl": "http://example.net",
            "mentalDisabilityCompliant": True,
            "address": {
                "street": "3, Chemin de la Plage",
                "city": "Poum, Tiabet",
                "postalCode": "98826",
                "latitude": -20.08521415490879,
                "longitude": 164.03239215718415,
                "label": "Marais Salins de Kô",
                "isManualEdition": True,
            },
        }

        response = client.with_session_auth("user@example.com").patch(f"/offers/{offer.id}", json=data)

        assert response.status_code == 200
        assert response.json["id"] == offer.id
        updated_offer = Offer.query.get(offer.id)
        address = updated_offer.offererAddress.address
        assert updated_offer.offererAddress.label == "Marais Salins de Kô"
        assert address.street == data["address"]["street"]
        assert address.city == data["address"]["city"]
        assert address.postalCode == data["address"]["postalCode"]
        assert address.inseeCode == None
        assert address.latitude == Decimal("-20.08521")
        assert address.longitude == Decimal("164.03239")
        assert address.isManualEdition is True

    @pytest.mark.parametrize("label", ["", None, True])
    @patch("pcapi.connectors.api_adresse.get_address")
    def test_patch_offer_with_address_twice(self, get_address_mock, label, client):
        user_offerer = offerers_factories.UserOffererFactory(user__email="user@example.com")
        venue = offerers_factories.VenueFactory(
            managingOfferer=user_offerer.offerer,
            offererAddress__address__street="1 rue de la paix",
            offererAddress__address__city="Paris",
            offererAddress__address__postalCode="75102",
            offererAddress__address__latitude=48.8566,
            offererAddress__address__longitude=2.3522,
            offererAddress__label=None,
        )
        offer = offers_factories.OfferFactory(
            subcategoryId=subcategories.ABO_MEDIATHEQUE.id,
            venue=venue,
            name="New name",
            description="description",
            offererAddress=venue.offererAddress,
        )
        oa_id = venue.offererAddress.id
        if label is True:
            label = venue.common_name

        data = {
            "name": "New name",
            "externalTicketOfficeUrl": "http://example.net",
            "mentalDisabilityCompliant": True,
            "address": {
                "street": "1 rue de la paix",
                "city": "Paris",
                "postalCode": "75102",
                "latitude": 48.8566,
                "longitude": 2.3522,
                "label": label,
            },
        }
        get_address_mock.return_value = api_adresse.AddressInfo(
            street="1 rue de la paix",
            city="Paris",
            citycode="75102",
            postcode="75102",
            latitude=48.8566,
            longitude=2.3522,
            score=0.9,
            id="75102_7560_00001",
            label="",
        )
        response = client.with_session_auth("user@example.com").patch(f"/offers/{offer.id}", json=data)
        assert response.status_code == 200
        assert response.json["id"] == offer.id
        updated_offer = Offer.query.get(offer.id)
        assert updated_offer.offererAddress.id == oa_id
        address = updated_offer.offererAddress.address
        assert updated_offer.offererAddress.label == venue.offererAddress.label
        assert address.street == "1 rue de la paix"
        assert address.city == "Paris"
        assert address.postalCode == "75102"
        assert address.latitude == Decimal("48.85660")
        assert address.longitude == Decimal("2.3522")
        assert address.isManualEdition is False

    def test_withdrawal_can_be_updated(self, client):
        offer = offers_factories.OfferFactory(
            subcategoryId=subcategories.CONCERT.id,
            bookingContact="booking@conta.ct",
            name="New name",
        )
        offerers_factories.UserOffererFactory(user__email="user@example.com", offerer=offer.venue.managingOfferer)

        data = {
            "withdrawalDetails": "Veuillez récuperer vos billets à l'accueil :)",
            "withdrawalType": "no_ticket",
        }
        response = client.with_session_auth("user@example.com").patch(f"/offers/{offer.id}", json=data)

        assert response.status_code == 200
        offer = Offer.query.get(offer.id)
        assert offer.withdrawalDetails == "Veuillez récuperer vos billets à l'accueil :)"
        assert offer.withdrawalType == WithdrawalTypeEnum.NO_TICKET

    def test_withdrawal_update_send_email_to_each_related_booker(self, client):
        # given
        offer = offers_factories.OfferFactory(
            subcategoryId=subcategories.CONCERT.id,
            bookingContact="booking@conta.ct",
            name="New name",
        )
        offerers_factories.UserOffererFactory(user__email="user@example.com", offerer=offer.venue.managingOfferer)
        stock = offers_factories.StockFactory(offer=offer)
        bookings = [bookings_factories.BookingFactory(stock=stock) for _ in range(3)]

        data = {
            "withdrawalDetails": "conditions de retrait",
            "withdrawalType": "no_ticket",
            "shouldSendMail": "true",
        }

        # when
        response = client.with_session_auth("user@example.com").patch(f"/offers/{offer.id}", json=data)

        # then
        assert response.status_code == 200
        assert len(mails_testing.outbox) == 3

        outbox = sorted(mails_testing.outbox, key=lambda mail: mail["params"]["OFFER_TOKEN"])
        bookings.sort(key=lambda b: b.activationCode.code if getattr(b, "activationCode") else b.token)
        assert [mail["To"] for mail in outbox] == [b.user.email for b in bookings]
        assert [mail["params"]["USER_FIRST_NAME"] for mail in outbox] == [b.user.firstName for b in bookings]
        assert [mail["params"]["OFFER_NAME"] for mail in outbox] == [b.stock.offer.name for b in bookings]
        assert [mail["params"]["OFFER_TOKEN"] for mail in outbox] == [
            b.activationCode.code if b.activationCode else b.token for b in bookings
        ]
        assert [mail["params"]["OFFER_WITHDRAWAL_DELAY"] for mail in outbox] == [None] * 3
        assert [mail["params"]["OFFER_WITHDRAWAL_DETAILS"] for mail in outbox] == ["conditions de retrait"] * 3
        assert [mail["params"]["OFFER_WITHDRAWAL_TYPE"] for mail in outbox] == ["no_ticket"] * 3
        assert [mail["params"]["OFFERER_NAME"] for mail in outbox] == [offer.venue.managingOfferer.name] * 3
        assert [mail["params"]["VENUE_ADDRESS"] for mail in outbox] == [
            f"{offer.venue.street} {offer.venue.postalCode} {offer.venue.city}"
        ] * 3

    def test_withdrawal_update_does_not_send_email_if_not_specified_so(self, client):
        # given
        offer = offers_factories.OfferFactory(
            subcategoryId=subcategories.CONCERT.id,
            bookingContact="booking@conta.ct",
            name="New name",
        )
        offerers_factories.UserOffererFactory(user__email="user@example.com", offerer=offer.venue.managingOfferer)
        stock = offers_factories.StockFactory(offer=offer)
        _ = [bookings_factories.BookingFactory(stock=stock) for _ in range(3)]

        data = {
            "withdrawalDetails": "conditions de retrait",
            "withdrawalType": "no_ticket",
            "shouldSendMail": "false",
        }

        # when
        response = client.with_session_auth("user@example.com").patch(f"/offers/{offer.id}", json=data)

        # then
        assert response.status_code == 200
        assert len(mails_testing.outbox) == 0


class Returns400Test:
    def when_trying_to_patch_forbidden_attributes(self, app, client):
        # Given
        offer = offers_factories.OfferFactory(
            subcategoryId=subcategories.CARTE_MUSEE.id,
            name="New name",
            url="test@test.com",
            description="description",
        )
        offerers_factories.UserOffererFactory(
            user__email="user@example.com",
            offerer=offer.venue.managingOfferer,
        )

        # When
        data = {
            "dateCreated": format_into_utc_date(datetime(2019, 1, 1)),
            "dateModifiedAtLastProvider": format_into_utc_date(datetime(2019, 1, 1)),
            "id": 1,
            "idAtProviders": 1,
            "lastProviderId": 1,
            "thumbCount": 2,
            "subcategoryId": subcategories.LIVRE_PAPIER.id,
        }
        response = client.with_session_auth("user@example.com").patch(f"offers/{offer.id}", json=data)

        # Then
        assert response.status_code == 400
        assert response.json["lastProviderId"] == ["Vous ne pouvez pas changer cette information"]
        forbidden_keys = {
            "dateCreated",
            "dateModifiedAtLastProvider",
            "id",
            "idAtProviders",
            "lastProviderId",
            "thumbCount",
            "subcategoryId",
        }
        for key in forbidden_keys:
            assert key in response.json

    def should_fail_when_url_has_no_scheme(self, app, client):
        # Given
        virtual_venue = offerers_factories.VirtualVenueFactory()
        offer = offers_factories.OfferFactory(
            venue=virtual_venue,
            subcategoryId=subcategories.CARTE_MUSEE.id,
            name="New name",
            url="test@test.com",
            description="description",
        )
        offerers_factories.UserOffererFactory(
            user__email="user@example.com",
            offerer=offer.venue.managingOfferer,
        )

        # When
        data = {
            "name": "Les lièvres pas malins",
            "url": "missing.something",
        }
        response = client.with_session_auth("user@example.com").patch(f"offers/{offer.id}", json=data)

        # Then
        assert response.status_code == 400
        assert response.json["url"] == ['L\'URL doit commencer par "http://" ou "https://"']

    def should_fail_when_externalTicketOfficeUrl_has_no_scheme(self, app, client):
        # Given
        virtual_venue = offerers_factories.VirtualVenueFactory()
        offer = offers_factories.OfferFactory(
            venue=virtual_venue,
            subcategoryId=subcategories.CARTE_MUSEE.id,
            name="New name",
            url="test@test.com",
            description="description",
        )
        offerers_factories.UserOffererFactory(
            user__email="user@example.com",
            offerer=offer.venue.managingOfferer,
        )

        # When
        data = {
            "name": "Les lièvres pas malins",
            "externalTicketOfficeUrl": "missing.something",
        }
        response = client.with_session_auth("user@example.com").patch(f"offers/{offer.id}", json=data)

        # Then
        assert response.status_code == 400
        assert response.json["externalTicketOfficeUrl"] == ['L\'URL doit commencer par "http://" ou "https://"']

    def should_fail_when_url_has_no_host(self, app, client):
        # Given
        virtual_venue = offerers_factories.VirtualVenueFactory()
        offer = offers_factories.OfferFactory(
            venue=virtual_venue,
            name="New name",
            subcategoryId=subcategories.CARTE_MUSEE.id,
            url="test@test.com",
            description="description",
        )
        offerers_factories.UserOffererFactory(
            user__email="user@example.com",
            offerer=offer.venue.managingOfferer,
        )

        # When
        data = {
            "name": "Les lièvres pas malins",
            "url": "https://missing",
        }
        response = client.with_session_auth("user@example.com").patch(f"offers/{offer.id}", json=data)

        # Then
        assert response.status_code == 400
        assert response.json["url"] == ['L\'URL doit terminer par une extension (ex. ".fr")']

    def should_fail_when_externalTicketOfficeUrl_has_no_host(self, app, client):
        # Given
        virtual_venue = offerers_factories.VirtualVenueFactory()
        offer = offers_factories.OfferFactory(
            venue=virtual_venue,
            name="New name",
            subcategoryId=subcategories.CARTE_MUSEE.id,
            url="test@test.com",
            description="description",
        )
        offerers_factories.UserOffererFactory(
            user__email="user@example.com",
            offerer=offer.venue.managingOfferer,
        )

        # When
        data = {
            "name": "Les lièvres pas malins",
            "externalTicketOfficeUrl": "https://missing",
        }
        response = client.with_session_auth("user@example.com").patch(f"offers/{offer.id}", json=data)

        # Then
        assert response.status_code == 400
        assert response.json["externalTicketOfficeUrl"] == ['L\'URL doit terminer par une extension (ex. ".fr")']

    def test_patch_non_approved_offer_fails(self, app, client):
        offer = offers_factories.OfferFactory(
            validation=OfferValidationStatus.PENDING,
            name="New name",
            subcategoryId=subcategories.CARTE_MUSEE.id,
            url="test@test.com",
            description="description",
        )
        offerers_factories.UserOffererFactory(
            user__email="user@example.com",
            offerer=offer.venue.managingOfferer,
        )

        data = {
            "visualDisabilityCompliant": True,
        }
        response = client.with_session_auth("user@example.com").patch(f"/offers/{offer.id}", json=data)

        assert response.status_code == 400
        assert response.json["global"] == ["Les offres refusées ou en attente de validation ne sont pas modifiables"]

    def test_reuse_unchanged_withdrawal(self, client):
        offer = offers_factories.OfferFactory(
            subcategoryId=subcategories.CONCERT.id,
            withdrawalType=WithdrawalTypeEnum.BY_EMAIL,
            withdrawalDelay=60 * 15,
            bookingContact="booking@conta.ct",
            name="New name",
            url="test@test.com",
            description="description",
        )
        offerers_factories.UserOffererFactory(user__email="user@example.com", offerer=offer.venue.managingOfferer)

        data = {
            "withdrawalType": "no_ticket",
        }
        response = client.with_session_auth("user@example.com").patch(f"offers/{offer.id}", json=data)

        assert response.status_code == 400
        assert response.json["offer"] == [
            "Il ne peut pas y avoir de délai de retrait lorsqu'il s'agit d'un évènement sans ticket"
        ]

    def test_booking_contact_is_checked_when_changed(self, client):
        offer = offers_factories.OfferFactory(
            subcategoryId=subcategories.CONCERT.id,
            withdrawalType=WithdrawalTypeEnum.BY_EMAIL,
            withdrawalDelay=60 * 15,
            bookingContact="booking@conta.ct",
            name="New name",
            url="test@test.com",
            description="description",
        )
        offerers_factories.UserOffererFactory(user__email="user@example.com", offerer=offer.venue.managingOfferer)

        data = {"bookingContact": None}
        response = client.with_session_auth("user@example.com").patch(f"offers/{offer.id}", json=data)

        assert response.status_code == 400
        assert response.json["offer"] == [
            "Une offre qui a un ticket retirable doit avoir l'email du contact de réservation"
        ]

    @override_features(WIP_EAN_CREATION=True)
    def should_fail_when_trying_to_update_offer_with_product_with_new_ean(self, client):
        user_offerer = offerers_factories.UserOffererFactory(user__email="user@example.com")
        venue = offerers_factories.VenueFactory(managingOfferer=user_offerer.offerer)
        product = offers_factories.ProductFactory(
            subcategoryId=subcategories.LIVRE_PAPIER.id,
            extraData={"ean": "1111111111111"},
            name="New name",
            description="description",
        )
        offer = offers_factories.OfferFactory(
            venue=venue,
            url="test@test.com",
            product=product,
        )

        data = {"extraData": {"ean": "2222222222222"}}
        response = client.with_session_auth("user@example.com").patch(f"/offers/{offer.id}", json=data)

        assert response.status_code == 400
        assert response.json["global"] == ["Les extraData des offres avec produit ne sont pas modifialbles"]


class Returns403Test:
    def when_user_is_not_attached_to_offerer(self, app, client):
        # Given
        offer = offers_factories.OfferFactory(
            name="Old name",
            subcategoryId=subcategories.CARTE_MUSEE.id,
            url="test@test.com",
            description="description",
        )
        offerers_factories.UserOffererFactory(user__email="user@example.com")

        # When
        data = {"name": "New name"}
        response = client.with_session_auth("user@example.com").patch(f"/offers/{offer.id}", json=data)

        # Then
        assert response.status_code == 403
        assert response.json["global"] == [
            "Vous n'avez pas les droits d'accès suffisants pour accéder à cette information."
        ]
        assert Offer.query.get(offer.id).name == "Old name"


class Returns404Test:
    def test_returns_404_if_offer_does_not_exist(self, app, client):
        # given
        users_factories.UserFactory(email="user@example.com")

        # when
        response = client.with_session_auth("user@example.com").patch("/offers/12345", json={})

        # then
        assert response.status_code == 404
