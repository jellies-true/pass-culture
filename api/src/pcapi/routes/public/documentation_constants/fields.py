import copy

from pydantic.v1 import Field

from pcapi.routes.public.documentation_constants import descriptions


_example_datetime_with_tz = "2034-07-24T14:00:00+02:00"


LIMIT_DESCRIPTION = "Number of items per page"


class _FIELDS:

    def __getattribute__(self, name):  # type: ignore [no-untyped-def]
        """
        This is maint to avoid side-effects between classes that share a field.

        Without this, here what happens :

            from pydantic.v1 import BaseModel
            from pydantic.v1 import Field
            from pcapi.serialization.utils import to_camel

            MY_FIELD_CONSTANT = Field(description="a field description")

            class SomeResponseModel(BaseModel):
                name_of_the_field: str = MY_FIELD_CONSTANT

                class Config:
                    alias_generator = to_camel  # this will add an alias `nameOfTheField` to `MY_FIELD_CONSANT`

            class SomeOtheResponseModel(BaseModel):
                # now this model expects a field `nameOfTheField` instead of `another_field_name`
                # because of the `SomeResponseModel` class definition
                another_field_name: str = MY_FIELD_CONSTANT
        """
        return copy.deepcopy(super().__getattribute__(name))

    VENUE_ID = Field(
        example=1234,
        description="Venue Id. The venues list is available on [**this endpoint (`Get offerer venues`)**](#tag/Offerer-and-Venues/operation/GetOffererVenues)",
    )
    DURATION_MINUTES = Field(
        description="Event duration in minutes",
        example=60,
    )
    ID_AT_PROVIDER = Field(
        description="Id of the object (product, event...) on your side. It should not be more than 70 characters long.",
        example="Your own id",
    )
    ID_AT_PROVIDER_WITH_MAX_LENGTH = Field(
        description="Id of the object (product, event...) on your side. It should not be more than 70 characters long.",
        example="Your own id",
        max_length=70,
    )
    PERIOD_BEGINNING_DATE = Field(
        description="Period beginning date. The expected format is **[ISO 8601](https://fr.wikipedia.org/wiki/ISO_8601)** (standard format for timezone aware datetime).",
        example="2024-03-03T13:00:00+02:00",
    )
    PERIOD_ENDING_DATE = Field(
        description="Period ending date. The expected format is **[ISO 8601](https://fr.wikipedia.org/wiki/ISO_8601)** (standard format for timezone aware datetime).",
        example="2024-05-10T15:00:00+02:00",
    )
    IDS_AT_PROVIDER_FILTER = Field(
        description="List of your ids to filter on", example="5edd982915c2a74b9302e443,5edd982915e2a74vb9302e443"
    )

    # Pagination Fields
    PAGINATION_LIMIT_WITH_DEFAULT = Field(default=50, le=50, gt=0, description="Maximum number of items per page.")
    PAGINATION_FIRST_INDEX_WITH_DEFAULT = Field(
        default=1,
        ge=1,
        description="The page of results will be fetched starting from `firstIndex` (which is a resource id). **To learn more about cursor-based pagination [see this page](/understanding-our-api/resources/cursor-pagination)**.",
    )

    # Image Fields
    IMAGE_CREDIT = Field(description="Image owner or author", example="Jane Doe")
    IMAGE_FILE = Field(
        description="Image file encoded in base64 string. Image format must be PNG or JPEG. Size must be between 400x600 and 800x1200 pixels. Aspect ratio must be 2:3 (portrait format).",
        example="iVBORw0KGgoAAAANSUhEUgAAAhUAAAMgCAAAAACxT88IAAABImlDQ1BJQ0MgcHJvZmlsZQAAKJGdkLFKw1AUhr+0oiKKg6IgDhlcO5pFB6tCKCjEWMHqlCYpFpMYkpTiG/gm+jAdBMFXcFdw9r/RwcEs3nD4Pw7n/P+9gZadhGk5dwBpVhWu3x1cDq7shTfa+lbZZC8Iy7zreSc0ns9XLKMvHePVPPfnmY/iMpTOVFmYFxVY+2JnWuWGVazf9v0j8YPYjtIsEj+Jd6I0Mmx2/TSZhD+e5jbLcXZxbvqqbVx6nOJhM2TCmISKjjRT5xiHXalLQcA9JaE0IVZvqpmKG1EpJ5dDUV+k2zTkbdV5nlKG8hjLyyTckcrT5GH+7/fax1m9aW3M8qAI6lZb1RqN4P0RVgaw9gxL1w1Zi7/f1jDj1DP/fOMXG7hQfuNVil0AAAAJcEhZcwAALiMAAC4jAXilP3YAAAAHdElNRQfnAwMPGDrdy1JyAAABtElEQVR42u3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8GaFGgABH6N7kwAAAABJRU5ErkJggg==",
    )
    IMAGE_URL = Field(description="Image URL publicly accessible", example="https://example.com/image.png")

    # Disability fields
    AUDIO_DISABILITY_COMPLIANT = Field(description="Is accessible for people with hearing disability", example=True)
    MENTAL_DISABILITY_COMPLIANT = Field(
        description="Is accessible for people with mental or cognitive disability", example=True
    )
    MOTOR_DISABILITY_COMPLIANT = Field(description="Is accessible for people with motor disability", example=True)
    VISUAL_DISABILITY_COMPLIANT = Field(description="Is accessible for people with visual disability", example=True)
    AUDIO_DISABILITY_COMPLIANT_WITH_DEFAULT = Field(
        False, description="Is accessible for people with hearing disability", example=True
    )
    MENTAL_DISABILITY_COMPLIANT_WITH_DEFAULT = Field(
        False, description="Is accessible for people with mental disability", example=True
    )
    MOTOR_DISABILITY_COMPLIANT_WITH_DEFAULT = Field(
        False, description="Is accessible for people with motor disability", example=True
    )
    VISUAL_DISABILITY_COMPLIANT_WITH_DEFAULT = Field(
        False, description="Is accessible for people with visual disability", example=True
    )

    # Offer fields
    OFFER_ID = Field(description="Offer id", example=12345)
    OFFER_STATUS = Field(description=descriptions.OFFER_STATUS_FIELD_DESCRIPTION, example="ACTIVE")
    OFFER_NAME = Field(description="Offer title", example="Le Petit Prince")
    OFFER_DESCRIPTION = Field(
        description="Offer description", example="A great book for kids and old kids.", max_length=1000
    )
    OFFER_NAME_WITH_MAX_LENGTH = Field(description="Offer title", example="Le Petit Prince", max_length=90)
    OFFER_DESCRIPTION = Field(
        description="Offer description",
        example="A great book for kids and old kids.",
    )
    OFFER_DESCRIPTION_WITH_MAX_LENGTH = Field(
        description="Offer description",
        example="A great book for kids and old kids.",
        max_length=1000,
    )
    OFFER_BOOKING_EMAIL = Field(
        description="Recipient email for notifications about bookings, cancellations, etc.",
        example="contact@yourcompany.com",
    )
    OFFER_BOOKING_CONTACT = Field(
        description="Recipient email to contact if there is an issue with booking the offer. Mandatory if the offer has withdrawable tickets.",
        example="support@yourcompany.com",
    )
    OFFER_PUBLICATION_DATE = Field(
        description="Date and time when we want the offer to be published on the native app. It cannot be a date in the past, and the time must be on the exact hour. The expected format is **[ISO 8601](https://fr.wikipedia.org/wiki/ISO_8601)** (standard format for timezone aware datetime)",
        example=_example_datetime_with_tz,
    )
    OFFER_ENABLE_DOUBLE_BOOKINGS_WITH_DEFAULT = Field(
        description="If set to true, users may book the offer for two persons. Second item will be delivered at the same price as the first one. Category must be compatible with this feature.",
        example=True,
        default=False,
    )
    OFFER_ENABLE_DOUBLE_BOOKINGS_ENABLED = Field(
        description="If set to true, users may book the offer for two persons. Second item will be delivered at the same price as the first one. Category must be compatible with this feature.",
        example=True,
        default=True,
    )

    # Products fields
    EANS_FILTER = Field(description="EANs list (max 100)", example="3700551782888,9782895761792")
    EAN = Field(
        description="European Article Number (EAN-13)",
        example="3700551782888",
    )

    # Event fields
    PRICE_CATEGORY_ID = Field(description="Price category id", example=12)
    PRICE_CATEGORY_LABEL = Field(description="Price category label", example="Carré or")
    PRICE_CATEGORIES = Field(description="Available price categories for this offer stocks")
    BEGINNING_DATETIME = Field(
        description="Beginning datetime of the event. The expected format is **[ISO 8601](https://fr.wikipedia.org/wiki/ISO_8601)** (standard format for timezone aware datetime).",
        example=_example_datetime_with_tz,
    )
    BOOKING_LIMIT_DATETIME = Field(
        description=descriptions.BOOKING_LIMIT_DATETIME_FIELD_DESCRIPTION,
        example=_example_datetime_with_tz,
    )
    EVENT_HAS_TICKET = Field(
        description="Indicated whether a ticket is mandatory to access to the event. True if it is the case, False otherwise. The ticket will be sent by you, the provider and you must have developed the pass Culture ticketing interface to do so.",
        example=False,
    )
    EVENT_DURATION = Field(description="Event duration in minutes", example=60)

    # Booking fields
    BOOKING_STATUS = Field(description=descriptions.BOOKING_STATUS_DESCRIPTION, example="CONFIRMED")

    # Stock fields
    STOCK_ID = Field(description="Stock id", example=45)
    QUANTITY = Field(
        description="Quantity of items currently available to pass Culture. Value `'unlimited'` is used for infinite quantity of items.",
        example=10,
    )
    PRICE = Field(description="Offer price in euro cents", example=1000)

    # Collective offer fields
    COLLECTIVE_OFFER_ID = Field(description="Collective offer id", example=12345)
    COLLECTIVE_OFFER_STATUS = Field(
        description=descriptions.COLLECTIVE_OFFER_STATUS_FIELD_DESCRIPTION, example="ACTIVE"
    )
    COLLECTIVE_OFFER_NAME = Field(description="Collective offer name", example="Atelier de peinture")
    COLLECTIVE_OFFER_DESCRIPTION = Field(
        description="Collective offer description", example="Atelier de peinture à la gouache pour élèves de 5ème"
    )
    COLLECTIVE_OFFER_SUBCATEGORY_ID = Field(description="Event subcategory id", example="FESTIVAL_MUSIQUE")
    COLLECTIVE_OFFER_FORMATS = Field(description="Educational Formats", example=["Atelier de pratique"])
    COLLECTIVE_OFFER_BOOKING_EMAILS = Field(
        description="Recipient emails for notifications about bookings, cancellations, etc.",
        example=["some@email.com", "some.other@email.com"],
    )
    COLLECTIVE_OFFER_CONTACT_EMAIL = Field(
        example="contact@yourcompany.com",
        description="Email of the person to contact if there is an issue with the offer.",
    )
    COLLECTIVE_OFFER_CONTACT_PHONE = Field(
        example="0123456789",
        description="Phone of the person to contact if there is an issue with the offer.",
    )
    COLLECTIVE_OFFER_EDUCATIONAL_DOMAINS = Field(
        example=[1, 2],
        description="Educational domains ids linked to the offer. Those domains are available on **[this endpoint (`Get the eductional domains`)](#tag/Collective-educational-data/operation/ListEducationalDomains)**",
    )
    COLLECTIVE_OFFER_STUDENT_LEVELS = Field(
        description="Student levels that can take pat to the collective offer. The student levels are available on [**this endpoint (`Get student levels eligible for collective offers`)**](#tag/Collective-educational-data/operation/ListStudentsLevels)",
        example=["GENERAL2", "GENERAL1", "GENERAL0"],
    )
    COLLECTIVE_OFFER_IS_ACTIVE = Field(description="Is your offer active", example=True)
    COLLECTIVE_OFFER_IS_SOLD_OUT = Field(description="Is your offer sold out", example=False)
    COLLECTIVE_OFFER_NATIONAL_PROGRAM_ID = Field(
        description="Id of the national program linked to your offer. The national programs list can be found on **[this endpoint (`Get all known national programs`)](#tag/Collective-educational-data/operation/GetNationalPrograms)**",
        example=123456,
    )
    COLLECTIVE_OFFER_DATE_CREATED = Field(description="Collective offer creation date")
    COLLECTIVE_OFFER_BEGINNING_DATETIME = Field(
        description="Collective offer beginning datetime. It cannot be a date in the past. The expected format is **[ISO 8601](https://fr.wikipedia.org/wiki/ISO_8601)** (standard format for timezone aware datetime).",
        example=_example_datetime_with_tz,
    )
    COLLECTIVE_OFFER_START_DATETIME = Field(
        description="Collective offer start datetime. Replaces beginning dateime. It cannot be a date in the past. The expected format is **[ISO 8601](https://fr.wikipedia.org/wiki/ISO_8601)** (standard format for timezone aware datetime).",
        example=_example_datetime_with_tz,
    )
    COLLECTIVE_OFFER_END_DATETIME = Field(
        description="Collective offer end datetime. It cannot be a date in the past. The expected format is **[ISO 8601](https://fr.wikipedia.org/wiki/ISO_8601)** (standard format for timezone aware datetime).",
        example=_example_datetime_with_tz,
    )
    COLLECTIVE_OFFER_BOOKING_LIMIT_DATETIME = Field(
        description="Booking limit datetime. It must be anterior to the `beginning_datetime`. The expected format is **[ISO 8601](https://fr.wikipedia.org/wiki/ISO_8601)** (standard format for timezone aware datetime).",
        example=_example_datetime_with_tz,
    )
    COLLECTIVE_OFFER_TOTAL_PRICE = Field(example=100.00, description="Collective offer price (in €)")
    COLLECTIVE_OFFER_NB_OF_TICKETS = Field(example=10, description="Number of tickets for your collective offer")
    COLLECTIVE_OFFER_EDUCATIONAL_PRICE_DETAIL = Field(
        description="The explanation of the offer price", example="10 tickets x 10 € = 100 €"
    )
    # Collective booking
    COLLECTIVE_BOOKING_ID = Field(description="Collective booking id")
    COLLECTIVE_BOOKING_STATUS = Field(description="Collective booking status", example="PENDING")
    COLLECTIVE_BOOKING_DATE_CREATED = Field(description="When the booking was made")
    COLLECTIVE_BOOKING_CONFIRMATION_DATE = Field(description="When the booking was confirmed")
    COLLECTIVE_BOOKING_REIMBURSED_DATA = Field(description="When the booking was reimbursed")
    COLLECTIVE_BOOKING_DATE_USED = Field(description="When the booking was used")
    COLLECTIVE_BOOKING_CANCELLATION_LIMIT_DATE = Field(description="Deadline to cancel the booking")
    # Educational institution fields
    EDUCATIONAL_INSTITUTION_ID = Field(
        description="Educational institution id in the pass Culture application. Institutions can be found on **[this endpoint (`Get all educational institutions`)](#tag/Collective-educational-data/operation/ListEducationalInstitutions)**",
        example=1234,
    )
    EDUCATIONAL_INSTITUTION_UAI = Field(
        description='Educational institution UAI ("Unité Administrative Immatriculée") code. Institutions can be found on **[this endpoint (`Get all educational institutions`)](#tag/Collective-educational-data/operation/ListEducationalInstitutions)**',
        example="0010008D",
    )
    EDUCATIONAL_INSTITUTION_NAME = Field(
        description="Educational institution name",
        example="Lycée Pontus de Tyard",
    )
    EDUCATIONAL_INSTITUTION_TYPE = Field(
        description="Educational institution type",
        example="LYCEE GENERAL",
    )
    EDUCATIONAL_INSTITUTION_CITY = Field(
        description="City where the educational institution is located",
        example="Chalon-sur-Saône",
    )
    EDUCATIONAL_INSTITUTION_POSTAL_CODE = Field(
        description="Educational institution postal code",
        example="71100",
    )
    # Educational domain fields
    EDUCATIONAL_DOMAIN_ID = Field(description="Educational domain id", example=123456)
    EDUCATIONAL_DOMAIN_NAME = Field(description="Educational domain name", example="Cinéma, audiovisuel")
    # National program fields
    NATIONAL_PROGRAM_ID = Field(description="National program id", example=1223456)
    NATIONAL_PROGRAM_NAME = Field(description="National program name", example="Collège au cinéma")
    # Student level fields
    STUDENT_LEVEL_ID = Field(description="Student level id", example="COLLEGE6")
    STUDENT_LEVEL_NAME = Field(description="Student level name", example="Collège - 6e")

    # Provider fields
    PROVIDER_ID = Field(description="Provider id", example=123456)
    PROVIDER_NAME = Field(description="Provider name", example="Ultimate ticketing solution")
    PROVIDER_LOGO_URL = Field(
        description="Provider logo url", example="https://ultimate-ticketing-solution.com/logo.png"
    )
    PROVIDER_NOTIFICATION_URL = Field(
        description="Url on which booking notifications on offers you created are sent",
        example="https://ultimate-ticketing-solution.com/pass-culture-endpoint",
    )
    PROVIDER_BOOKING_URL = Field(
        description="Url on which tickets requests for events you created are sent",
        example="https://ultimate-ticketing-solution.com/pass-culture-booking-endpoint",
    )
    PROVIDER_CANCEL_URL = Field(
        description="Url on which tickets cancellation requests for events you created are sent",
        example="https://ultimate-ticketing-solution.com/pass-culture-cancellation-endpoint",
    )

    # Venue fields
    VENUE_ACTIVITY_DOMAIN = Field(description="Venue activity domain", example="RECORD_STORE")
    VENUE_SIRET_COMMENT = Field(description="Applicable if siret is null and venue is physical")
    VENUE_SIRET = Field(
        description="Venue siret. `null` when the venue is digital or when the `siretComment` field is not `null`.",
        example="85331845900049",
    )
    VENUE_CREATED_DATETIME = Field(description="When the venue was created")
    VENUE_LOCATION = Field(
        description="Location where the offers will be available or will take place. There is exactly one digital venue per offerer, which is listed although its id is not required to create a digital offer (see DigitalLocation model).",
        discriminator="type",
    )
    VENUE_LEGAL_NAME = Field(description="Venue legal name", example="SAS pass Culture")
    VENUE_PUBLIC_NAME = Field(
        description="Venue public name. If `null`, `legalName` is used instead.", example="pass Culture"
    )
    VENUE_NOTIFICATION_URL = Field(
        description="Url on which notifications for this venues will be sent. If not set, our system will use the notification url defined at provider level.",
        example="https://mysolution.com/pass-culture-endpoint",
    )
    VENUE_BOOKING_URL = Field(
        description="Url on which requests for tickets are sent when a beneficiary tries to book tickets for an event linked to this venue. If not set, our system will use the booking url defined at provider level.",
        example="https://my-ticketing-solution.com/pass-culture-booking-endpoint",
    )
    VENUE_CANCEL_URL = Field(
        description="Url on which tickets cancellation requests are sent when a beneficiary cancels its tickets for an event linked to this venue. If not set, our system will use the cancel url defined at provider level.",
        example="https://my-ticketing-solution.com/pass-culture-cancellation-endpoint",
    )


fields = _FIELDS()
