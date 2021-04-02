from typing import Optional

from pcapi.core.providers.models import Provider
from pcapi.infrastructure.container import api_fnac_stocks
from pcapi.infrastructure.container import api_libraires_stocks
from pcapi.infrastructure.container import api_praxiel_stocks
from pcapi.infrastructure.container import api_titelive_stocks
from pcapi.local_providers.provider_api import synchronize_provider_api
from pcapi.models import ApiErrors
from pcapi.models import Venue
from pcapi.models import VenueProvider
from pcapi.repository import repository


SPECIFIC_STOCK_PROVIDER = {
    "LibrairesStocks": api_libraires_stocks,
    "FnacStocks": api_fnac_stocks,
    "TiteLiveStocks": api_titelive_stocks,
    "PraxielStocks": api_praxiel_stocks,
}
ERROR_CODE_PROVIDER_NOT_SUPPORTED = 400
ERROR_CODE_SIRET_NOT_SUPPORTED = 422


def connect_venue_to_provider(
    venue: Venue,
    provider: Provider,
) -> VenueProvider:
    _check_provider_can_be_used(provider)
    _check_venue_can_be_synchronized_with_provider(venue.siret, provider)

    venue_provider = VenueProvider()
    venue_provider.venue = venue
    venue_provider.provider = provider
    venue_provider.venueIdAtOfferProvider = venue.siret

    repository.save(venue_provider)
    return venue_provider


def _check_provider_can_be_used(
    provider: Provider,
) -> None:
    if not provider.implements_provider_api and provider.localClass not in SPECIFIC_STOCK_PROVIDER:
        api_errors = ApiErrors()
        api_errors.status_code = ERROR_CODE_PROVIDER_NOT_SUPPORTED
        api_errors.add_error("provider", "Provider non pris en charge")
        raise api_errors


def _check_venue_can_be_synchronized_with_provider(
    siret: str,
    provider: Provider,
) -> None:
    if not _siret_can_be_synchronized(siret, provider):
        api_errors = ApiErrors()
        api_errors.status_code = ERROR_CODE_SIRET_NOT_SUPPORTED
        api_errors.add_error("provider", _get_synchronization_error_message(provider.name, siret))
        raise api_errors


def _siret_can_be_synchronized(
    siret: str,
    provider: Provider,
) -> bool:
    if not siret:
        return False

    if provider.implements_provider_api:
        return synchronize_provider_api.check_siret_can_be_synchronized(siret, provider)
    return SPECIFIC_STOCK_PROVIDER[provider.localClass].can_be_synchronized(siret)


def _get_synchronization_error_message(provider_name: str, siret: Optional[str]) -> str:
    if siret:
        return f"L’importation d’offres avec {provider_name} n’est pas disponible pour le SIRET {siret}"
    return f"L’importation d’offres avec {provider_name} n’est pas disponible sans SIRET associé au lieu. Ajoutez un SIRET pour pouvoir importer les offres."
