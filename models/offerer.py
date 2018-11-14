""" offerer """
from datetime import datetime

from sqlalchemy import BigInteger, \
    Column, \
    DateTime, \
    Index, \
    String, \
    TEXT
from sqlalchemy.orm import relationship
from sqlalchemy.sql.expression import cast
from sqlalchemy.sql.functions import coalesce

from models.has_bank_information_mixin import HasBankInformationMixin
from models.versioned_mixin import VersionedMixin
from models.db import Model
from models.deactivable_mixin import DeactivableMixin
from models.has_address_mixin import HasAddressMixin
from models.has_thumb_mixin import HasThumbMixin
from models.needs_validation_mixin import NeedsValidationMixin
from models.pc_object import PcObject
from models.providable_mixin import ProvidableMixin
from models.user_offerer import UserOfferer
from domain.search import create_tsvector


class Offerer(PcObject,
              HasThumbMixin,
              HasAddressMixin,
              ProvidableMixin,
              NeedsValidationMixin,
              DeactivableMixin,
              VersionedMixin,
              HasBankInformationMixin,
              Model):
    id = Column(BigInteger, primary_key=True)

    dateCreated = Column(DateTime,
                         nullable=False,
                         default=datetime.utcnow)

    name = Column(String(140), nullable=False)

    users = relationship('User',
                         secondary='user_offerer')

    siren = Column(String(9), nullable=True,
                   unique=True)  # FIXME: should not be nullable, is until we have all SIRENs filled in the DB

    def give_rights(self, user, rights):
        if user:
            user_offerer = UserOfferer()
            user_offerer.offerer = self
            user_offerer.user = user
            user_offerer.rights = rights
            return user_offerer

    def errors(self):
        api_errors = super(Offerer, self).errors()
        api_errors.errors.update(HasAddressMixin.errors(self).errors)
        if self.siren is not None \
                and (not len(self.siren) == 9):
            # TODO: or not verify_luhn(self.siren)):
            api_errors.addError('siren', 'Ce code SIREN est invalide')
        self.check_bank_account_information(api_errors)

        return api_errors

    @property
    def nOffers(self):
        n_offers = 0
        for venue in self.managedVenues:
            n_offers += venue.nOffers
        return n_offers
        

Offerer.__ts_vector__ = create_tsvector(
    cast(coalesce(Offerer.name, ''), TEXT),
    cast(coalesce(Offerer.address, ''), TEXT),
    cast(coalesce(Offerer.siren, ''), TEXT)
)

Offerer.__table_args__ = (
    Index(
        'idx_offerer_fts',
        Offerer.__ts_vector__,
        postgresql_using='gin'
    ),
)
