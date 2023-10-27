/* istanbul ignore file */
import {
  BookingRecapResponseModel,
  GetIndividualOfferResponseModel,
  GetOfferManagingOffererResponseModel,
  GetOfferStockResponseModel,
  GetOfferVenueResponseModel,
  GetOffererResponseModel,
  GetOffererVenueResponseModel,
  OfferStatus,
  SubcategoryIdEnum,
  VenueListItemResponseModel,
  VenueTypeCode,
} from 'apiClient/v1'
import { BookingRecapStatus } from 'apiClient/v1/models/BookingRecapStatus'
import {
  BookingFormula,
  BookingOfferType,
  GetBookingResponse,
} from 'apiClient/v2'

let offerId = 1
let venueId = 1
let offererId = 1
let stockId = 1
let bookingId = 1

export const collectiveOfferFactory = (
  customCollectiveOffer = {},
  customStock = collectiveStockFactory() || null,
  customVenue = offerVenueFactory()
) => {
  const stocks = customStock === null ? [] : [customStock]
  const currentOfferId = offerId++

  return {
    name: `Le nom de l’offre ${currentOfferId}`,
    isActive: true,
    isEditable: true,
    isEvent: true,
    isFullyBooked: false,
    isThing: false,
    id: currentOfferId,
    status: OfferStatus.ACTIVE,
    stocks,
    venue: customVenue,
    hasBookingLimitDatetimesPassed: false,
    isEducational: true,
    ...customCollectiveOffer,
  }
}

const collectiveStockFactory = (customStock = {}) => {
  return {
    bookingsQuantity: 0,
    id: `STOCK${stockId++}`,
    offerId: `OFFER${offerId}`,
    price: 100,
    quantity: 1,
    remainingQuantity: 1,
    beginningDatetime: new Date('2021-10-15T12:00:00Z'),
    bookingLimitdatetime: new Date('2021-09-15T12:00:00Z'),
    ...customStock,
  }
}

export const GetIndividualOfferFactory = (
  customOffer = {},
  customStock = stockFactory() || null,
  customVenue = offerVenueFactory()
): GetIndividualOfferResponseModel => {
  const stocks = customStock === null ? [] : [customStock]
  const currentOfferId = offerId++

  return {
    name: `Le nom de l’offre ${currentOfferId}`,
    isActive: true,
    isActivable: true,
    isEditable: true,
    isEvent: false,
    isThing: true,
    id: currentOfferId,
    status: OfferStatus.ACTIVE,
    stocks,
    venue: customVenue,
    hasBookingLimitDatetimesPassed: false,
    dateCreated: '2020-04-12T19:31:12Z',
    isDigital: false,
    isDuo: true,
    isNational: true,
    subcategoryId: SubcategoryIdEnum.SEANCE_CINE,
    lastProvider: null,
    ...customOffer,
  }
}

export const getVenueListItemFactory = (
  customVenue = {},
  customOfferer = offererFactory()
): VenueListItemResponseModel => {
  const currentVenueId = venueId++
  return {
    id: currentVenueId,
    isVirtual: false,
    name: `Le nom du lieu ${currentVenueId}`,
    managingOffererId: customOfferer.id,
    publicName: 'Mon Lieu',
    hasCreatedOffer: true,
    hasMissingReimbursementPoint: true,
    offererName: 'offerer',
    venueTypeCode: VenueTypeCode.AUTRE,
    ...customVenue,
  }
}

export const offererFactory = (
  customOfferer = {}
): GetOfferManagingOffererResponseModel => {
  const currentOffererId = offererId++

  return {
    id: 3,
    name: `Le nom de la structure ${currentOffererId}`,
    ...customOfferer,
  }
}

export const offerVenueFactory = (
  customVenue: Partial<GetOfferVenueResponseModel> = {},
  customOfferer: GetOfferManagingOffererResponseModel = offererFactory()
): GetOfferVenueResponseModel => {
  const currentVenueId = venueId++

  return {
    id: currentVenueId,
    address: 'Ma Rue',
    city: 'Ma Ville',
    isVirtual: false,
    name: `Le nom du lieu ${currentVenueId}`,
    postalCode: '11100',
    publicName: 'Mon Lieu',
    departementCode: '78',
    visualDisabilityCompliant: true,
    mentalDisabilityCompliant: true,
    motorDisabilityCompliant: true,
    audioDisabilityCompliant: true,
    managingOfferer: customOfferer,
    ...customVenue,
  }
}

export const stockFactory = (customStock = {}): GetOfferStockResponseModel => {
  const id = stockId++
  return {
    bookingsQuantity: 0,
    id: id,
    price: 10,
    quantity: null,
    remainingQuantity: 2,
    dateCreated: '2020-04-12T19:31:12Z',
    dateModified: '2020-04-12T19:31:12Z',
    hasActivationCode: false,
    isBookable: true,
    isEventDeletable: true,
    isEventExpired: false,
    isSoftDeleted: false,
    ...customStock,
  }
}

export const bookingRecapFactory = (
  customBookingRecap = {},
  customOffer = {}
): BookingRecapResponseModel => {
  const offer = GetIndividualOfferFactory(customOffer)

  return {
    beneficiary: {
      email: 'user@example.com',
      firstname: 'First',
      lastname: 'Last',
      phonenumber: '0606060606',
    },
    bookingAmount: 0,
    bookingDate: '2020-04-12T19:31:12Z',
    bookingIsDuo: false,
    bookingStatus: BookingRecapStatus.BOOKED,
    bookingStatusHistory: [
      {
        date: '2020-04-12T19:31:12Z',
        status: BookingRecapStatus.BOOKED,
      },
    ],
    bookingToken: `TOKEN${bookingId++}`,
    stock: {
      offerId: offer.id,
      offerName: offer.name,
      offerIsEducational: false,
      stockIdentifier: offer.stocks[0].id,
      offerIsbn: '123456789',
    },
    ...customBookingRecap,
  }
}

export const defautGetOffererResponseModel: GetOffererResponseModel = {
  address: 'Fake Address',
  apiKey: {
    maxAllowed: 10,
    prefixes: [],
  },
  city: 'Fake City',
  dateCreated: '2022-01-01T00:00:00Z',
  hasAvailablePricingPoints: false,
  hasDigitalVenueAtLeastOneOffer: false,
  hasValidBankAccount: true,
  hasPendingBankAccount: false,
  venuesWithNonFreeOffersWithoutBankAccounts: [],
  isActive: false,
  isValidated: false,
  managedVenues: [],
  name: 'Ma super structure',
  id: 0,
  postalCode: '00000',
  dsToken: '',
}

export const defaultGetOffererVenueResponseModel: GetOffererVenueResponseModel =
  {
    collectiveDmsApplications: [],
    hasAdageId: false,
    hasCreatedOffer: false,
    hasMissingReimbursementPoint: false,
    isVirtual: false,
    name: 'Mon super lieu',
    id: 0,
    venueTypeCode: VenueTypeCode.LIEU_ADMINISTRATIF,
    hasVenueProviders: false,
  }

export const defaultBookingResponse: GetBookingResponse = {
  bookingId: 'test_booking_id',
  dateOfBirth: '1980-02-01T20:00:00Z',
  email: 'test@email.com',
  formula: BookingFormula.PLACE,
  isUsed: false,
  offerId: 12345,
  offerType: BookingOfferType.EVENEMENT,
  phoneNumber: '0100000000',
  publicOfferId: 'test_public_offer_id',
  theater: { theater_any: 'theater_any' },
  venueAddress: null,
  venueName: 'mon lieu',
  datetime: '2001-02-01T20:00:00Z',
  ean13: 'test ean113',
  offerName: 'Nom de la structure',
  price: 13,
  quantity: 1,
  userName: 'USER',
  firstName: 'john',
  lastName: 'doe',
  venueDepartmentCode: '75',
  priceCategoryLabel: 'price label',
}
