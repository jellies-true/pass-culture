import { Selector } from 'testcafe'

import { fetchSandbox } from './helpers/sandboxes'
import getMenuWalletValue from './helpers/getMenuWalletValue'
import getPageUrl from './helpers/getPageUrl'
import { ROOT_PATH } from '../src/utils/config'
import createUserRoleFromUserSandbox from './helpers/createUserRoleFromUserSandbox'

let offerPage = null
let offerPageVerso = null
let offerBookingPage = null
let currentBookedToken = null
let currentSelectedDay = null
let currentSelectedTime = null
let previousWalletValue = null
const myProfileURL = `${ROOT_PATH}profil`
const discoverURL = `${ROOT_PATH}decouverte`
const myBookingsURL = `${ROOT_PATH}reservations`

const bookingToken = Selector('#booking-booked-token')
const bookOfferButton = Selector('#verso-booking-button')
const checkReversedIcon = Selector('#verso-cancel-booking-button-reserved')
const bookingSuccessButton = Selector('#booking-success-ok-button')
const closeMenu = Selector('#main-menu-fixed-container .close-link')
const openMenuFromVerso = Selector('#verso-footer .profile-button')
const bookingErrorReasons = Selector('#booking-error-reasons p')
const openVerso = Selector('#deck-open-verso-button')
const timeSelectBox = Selector('#booking-form-time-picker-field')
const dateSelectBox = Selector('#booking-form-date-picker-field')
const sendBookingButton = Selector('#booking-validation-button')
const myBookingsMenuButton = Selector('#main-menu-navigation a').nth(2)
const profileWalletAllValue = Selector('#profile-wallet-balance-value')
const pickerPopper = Selector('#datepicker-popper-container')
const selectableDates = pickerPopper.find(
  '.react-datepicker__day:not(.react-datepicker__day--disabled)'
)
const selectedTime = timeSelectBox.find('.ant-select-selection-selected-value')

let userRole

fixture("08_05_01 Réservation d'une offre type event à dates multiple").beforeEach(async t => {
  if (!userRole) {
    userRole = await createUserRoleFromUserSandbox(
      'webapp_08_booking',
      'get_existing_webapp_user_can_book_multidates'
    )
  }
  const { offer } = await fetchSandbox('webapp_08_booking', 'get_non_free_event_offer')
  offerPage = `${discoverURL}/${offer.id}`
  offerPageVerso = new RegExp(`${offerPage}(/[A-Z0-9]*)?/verso`)
  offerBookingPage = `${offerPage}/booking`
  await t
    .useRole(userRole)
    .navigateTo(offerPage)
    .click(openVerso)
})

test("Le formulaire de réservation contient un selecteur de date et d'horaire", async t => {
  await t
    .click(bookOfferButton)
    .expect(getPageUrl())
    .eql(offerBookingPage)
    .expect(dateSelectBox.exists)
    .ok()
    .expect(timeSelectBox.exists)
    .ok()
    .expect(pickerPopper.exists)
    .ok()
})

// FIXME -> gérer la requête dans la sandbox, quand on saute de mois
test.skip('Le formulaire de réservation contient de multiple dates', async t => {
  await t
    .click(bookOfferButton)
    .expect(dateSelectBox.exists)
    .ok()
    .click(dateSelectBox)
    .expect(selectableDates.count)
    .gt(1)
})

test('Je sélectionne la première date, le champ de date se met à jour, un horaire est sélectionné', async t => {
  await t
    .click(bookOfferButton)
    .expect(dateSelectBox.exists)
    .ok()
    .click(dateSelectBox)
    .click(selectableDates.nth(0))
    .expect(dateSelectBox.value)
    .match(/^[0-9]{2}\s[a-zéû]{3,9}\s[0-9]{4}$/gi)
    .expect(selectedTime.textContent)
    .match(/^[0-9]{2}:[0-9]{2}\s-\s[0-9]+\s€$/gi)
})

test("Parcours complet de réservation d'une offre event à date unique", async t => {
  await t.click(openMenuFromVerso).wait(500)
  previousWalletValue = await getMenuWalletValue()
  await t
    .expect(previousWalletValue)
    .gt(0)
    .click(closeMenu)
    .click(bookOfferButton)
    .click(dateSelectBox)
    .click(selectableDates.nth(0))

  currentSelectedDay = await dateSelectBox.value
  currentSelectedTime = await selectedTime.textContent
  currentSelectedTime = currentSelectedTime.slice(0, 5)

  await t
    .click(sendBookingButton)
    .expect(bookingErrorReasons.count)
    .eql(0)
    .expect(bookingToken.exists)
    .ok()

  currentBookedToken = await bookingToken.textContent
  await t
    .click(bookingSuccessButton)
    .expect(getPageUrl())
    .eql(offerPage)
    .expect(checkReversedIcon.exists)
    .ok()
    .click(openMenuFromVerso)

  const currentWalletValue = await getMenuWalletValue()
  await t
    .expect(currentWalletValue)
    .gte(0)
    .expect(currentWalletValue)
    .lt(previousWalletValue)
  previousWalletValue = await getMenuWalletValue()

  const bookedOffer = Selector(`.mb-my-booking[data-token="${currentBookedToken}"]`)
  await t
    .click(myBookingsMenuButton)
    .expect(bookedOffer.exists)
    .ok()
    .click(bookedOffer)
    .expect(getPageUrl())
    .match(offerPageVerso)
    .expect(checkReversedIcon.exists)
    .ok()
})

test('Je vérifie mes réservations, après reconnexion', async t => {
  // FIXME: currentBookedToken devrait provenir d'une valeur
  // de la sandbox (ie que le fetch sandbox devrait aussi retourner un
  // objet booking) car sinon on ne peut pas
  // runner ce test de maniere standalone
  const bookedOffer = Selector(`.mb-my-booking[data-token="${currentBookedToken}"]`)

  await t
    .navigateTo(myBookingsURL)
    .expect(bookedOffer.exists)
    .ok()
    .click(bookedOffer)
    .expect(checkReversedIcon.exists)
    .ok()
})

test('Je vérifie le montant de mon pass, après reconnexion', async t => {
  const walletInfoSentence = `Il reste ${previousWalletValue} €`
  await t
    .navigateTo(myProfileURL)
    .expect(profileWalletAllValue.textContent)
    .eql(walletInfoSentence)
})

test('Je ne peux plus réserver cette offre, après reconnexion', async t => {
  await t
    .click(openMenuFromVerso)
    .expect(bookOfferButton.exists)
    .notOk()
    .expect(checkReversedIcon.exists)
    .ok()
})
