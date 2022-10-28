export enum Events {
  CLICKED_BOOKING = 'hasClickedBooking',
  CLICKED_CANCELED_SELECTED_OFFERS = 'hasClickedCancelOffers',
  CLICKED_DISABLED_SELECTED_OFFERS = 'hasClickedDisabledOffers',
  CLICKED_BREADCRUMBS_PROFILE_AND_HELP = 'hasClickedProfileAndHelp',
  CLICKED_BREADCRUMBS_STRUCTURES = 'hasClickedStructures',
  CLICKED_BREADCRUMBS_OFFERER_STATS = 'hasClickedBreadcrumOffererStats',
  CLICKED_CONSULT_CGU = 'hasClickedConsultCGU',
  CLICKED_CONSULT_SUPPORT = 'hasClickedConsultSupport',
  CLICKED_CREATE_ACCOUNT = 'hasClickedCreateAccount',
  CLICKED_CREATE_VENUE = 'hasClickedCreateVenue',
  CLICKED_ADD_BANK_INFORMATIONS = 'hasClickedAddBankInformation',
  CLICKED_NO_PRICING_POINT_SELECTED_YET = 'hasClickedNoPricingPointSelectedYet',
  CLICKED_ADD_VENUE_IN_OFFERER = 'hasClickedAddVenueInOfferer',
  CLICKED_ADD_FIRST_VENUE_IN_OFFERER = 'hasClickedAddFirstVenueInOfferer',
  CLICKED_SAVE_VENUE = 'hasClickedSaveVenue',
  CLICKED_DOWNLOAD_BOOKINGS = 'hasClickedDownloadBooking',
  CLICKED_DOWNLOAD_BOOKINGS_CSV = 'hasClickedDownloadBookingCsv',
  CLICKED_DOWNLOAD_BOOKINGS_OTHER_FORMAT = 'hasClickedDownloadBookingOtherFormat',
  CLICKED_DOWNLOAD_BOOKINGS_XLS = 'hasClickedDownloadBookingXls',
  CLICKED_EDIT_PROFILE = 'hasClickedEditProfile',
  CLICKED_FAQ = 'hasClickedFaq',
  CLICKED_FORGOTTEN_PASSWORD = 'hasClickedForgottenPassword',
  CLICKED_HELP_CENTER = 'hasClickedHelpCenter',
  CLICKED_HOME = 'hasClickedHome',
  CLICKED_LOGOUT = 'hasClickedLogout',
  CLICKED_MODIFY_OFFERER = 'hasClickedModifyOfferer',
  CLICKED_OFFER = 'hasClickedOffer',
  CLICKED_OFFER_FORM_NAVIGATION = 'hasClickedOfferFormNavigation',
  CLICKED_PERSONAL_DATA = 'hasClickedConsultPersonalData',
  CLICKED_PRO = 'hasClickedPro',
  CLICKED_REIMBURSEMENT = 'hasClickedReimbursement',
  CLICKED_SHOW_BOOKINGS = 'hasClickedShowBooking',
  CLICKED_STATS = 'hasClickedOffererStats',
  CLICKED_TICKET = 'hasClickedTicket',
  CLICKED_TOGGLE_HIDE_OFFERER_NAME = 'hasClickedToggleHideOffererName',
  CLICKED_VIEW_OFFERER_STATS = 'hasClickedViewOffererStats',
  CLICKED_VIEW_ALL_OFFERER_STATS = 'hasClickedViewAllOffererStats',
  CLICKED_EXPAND_COLLECTIVE_BOOKING_DETAILS = 'hasClickedExpandCollectiveBookingDetails',
  CLICKED_DUPLICATE_TEMPLATE_OFFER = 'hasClickedDuplicateTemplateOffer',
  FIRST_LOGIN = 'firstLogin',
  PAGE_VIEW = 'page_view',
  SIGNUP_FORM_ABORT = 'signupFormAbort',
  SIGNUP_FORM_SUCCESS = 'signupFormSuccess',
  TUTO_PAGE_VIEW = 'tutoPageView',
  DELETE_DRAFT_OFFER = 'DeleteDraftOffer',
}

export enum OFFER_FORM_NAVIGATION_MEDIUM {
  RECAP_LINK = 'RecapLink',
  STICKY_BUTTONS = 'StickyButtons',
  DRAFT_BUTTONS = 'DraftButtons',
  BREADCRUMB = 'Breadcrumb',
  HOME_BUTTON = 'HomeButton',
  HOME_LINK = 'HomeLink',
  HOME_VIRTUAL_LINK = 'HomeVirtualLink',
  OFFERS_BUTTON = 'OffersButton',
  OFFERER_LINK = 'OffererLink',
  VENUE_BUTTON = 'VenueButton',
  OFFERS_THUMB = 'OffersThumb',
  OFFERS_TITLE = 'OffersTitle',
  OFFERS_STOCKS = 'OffersStocks',
  OFFERS_PEN = 'OffersPen',
  BOOKINGS_TITLE = 'BookingsTitle',
  SUMMARY_PREVIEW = 'SummaryPreview',
  CONFIRMATION_PREVIEW = 'ConfirmationPreview',
  CONFIRMATION_BUTTON_NEW_OFFER = 'ConfirmationButtonNewOffer',
  CONFIRMATION_BUTTON_OFFER_LIST = 'ConfirmationButtonOfferList',
  DETAILS_PREVIEW = 'DetailsPreview',
  OFFERS_TRASH_ICON = 'OffersTrashicon',
}

export enum OFFER_FORM_NAVIGATION_OUT {
  OFFERS = 'Offers',
  PREVIEW = 'AppPreview',
  ROUTE_LEAVING_GUARD = 'RouteLeavingGuard',
}

export enum OFFER_FORM_NAVIGATION_IN {
  HOME = 'Home',
  OFFERS = 'Offers',
  OFFERER = 'Offerer',
  VENUE = 'Venue',
  BOOKINGS = 'Bookings',
}

export enum OFFER_FROM_TEMPLATE_ENTRIES {
  OFFERS_MODAL = 'OffersListModal',
  OFFERS = 'OffersList',
  OFFER_TEMPLATE_RECAP = 'OfferTemplateRecap',
}

export const OFFER_FORM_HOMEPAGE = 'OfferFormHomepage'
