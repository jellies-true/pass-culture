import re

from models.pc_object import PcObject
from utils.logger import logger
from utils.test_utils import create_venue

MOCK_NAMES = [
    "Atelier Herbert Marcuse",
    "Club Dorothy",
    "Maison de la Brique",
    "Les Perruches Swing",
    "Michel et son accordéon",
    "La librairie quantique",
    "Folie des anachorètes"
]

def create_industrial_venues(offerers_by_name):
    logger.info('create_industrial_venues')

    venue_by_name = {}
    mock_index = 0

    iban_prefix = 'FR7630001007941234567890185'
    bic_prefix, bic_suffix = 'QSDFGH8Z', 556

    offerer_items = offerers_by_name.items()
    for (offerer_index, (offerer_name, offerer))  in enumerate(offerer_items):
        geoloc_match = re.match(r'(.*)lat\:(.*) lon\:(.*)', offerer_name)

        venue_name = MOCK_NAMES[mock_index%len(MOCK_NAMES)]

        if offerer_index%4:
            iban = iban_prefix
            bic = bic_prefix + str(bic_suffix)
        else:
            iban = None
            bic = None

        venue_by_name[offerer_name] = create_venue(
            offerer,
            address=offerer.address,
            bic=bic,
            booking_email="fake@email.com",
            city=offerer.city,
            comment="Pas de siret car je suis un mock.",
            iban=iban,
            latitude=float(geoloc_match.group(2)),
            longitude=float(geoloc_match.group(3)),
            name=venue_name,
            postal_code=offerer.postalCode,
            siret=None
        )

        bic_suffix += 1
        mock_index += 1

        venue_by_name["{} (Offre en ligne)".format(venue_name)] = create_venue(
            offerer,
            is_virtual=True,
            name="{} (Offre en ligne)".format(venue_name),
            siret=None
        )

    PcObject.check_and_save(*venue_by_name.values())

    logger.info('created {} venues'.format(len(venue_by_name)))

    return venue_by_name
