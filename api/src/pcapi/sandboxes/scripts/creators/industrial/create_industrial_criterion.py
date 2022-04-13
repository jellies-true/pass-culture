import logging

import pcapi.core.criteria.factories as criteria_factories
from pcapi.models.offer_criterion import OfferCriterion
from pcapi.repository import repository


logger = logging.getLogger(__name__)


def create_industrial_criteria() -> dict:
    logger.info("create_industrial_criteria")

    criterion1 = criteria_factories.CriterionFactory(
        name="Bonne offre d’appel",
        description="Offre déjà beaucoup réservée par les autres jeunes",
    )
    criterion2 = criteria_factories.CriterionFactory(
        name="Mauvaise accroche",
        description="Offre ne possédant pas une accroche de qualité suffisante",
    )
    criterion3 = criteria_factories.CriterionFactory(
        name="Offre de médiation spécifique",
        description="Offre possédant une médiation orientée pour les jeunes de 18 ans",
    )

    criteria_by_name = {}
    for criterion in (criterion1, criterion2, criterion3):
        criteria_by_name[criterion.name] = criterion

    logger.info("created %d criteria", len(criteria_by_name))

    return criteria_by_name


def associate_criterion_to_one_offer_with_mediation(offers_by_name: dict, criteria_by_name: dict):  # type: ignore [no-untyped-def]
    offer = list(filter(lambda o: o.mediations is not None, list(offers_by_name.values())))[0]
    criterion = criteria_by_name["Offre de médiation spécifique"]

    offer_criterion = OfferCriterion()
    offer_criterion.offer = offer
    offer_criterion.criterion = criterion

    repository.save(offer_criterion)
