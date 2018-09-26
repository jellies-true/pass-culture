import get from 'lodash.get'
import {
  CancelButton,
  closeModal,
  Field,
  Form,
  Icon,
  mergeErrors,
  mergeForm,
  requestData,
  showModal,
  showNotification,
  SubmitButton,
  withLogin,
  eddSelectors,
} from 'pass-culture-shared'
import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { NavLink, withRouter } from 'react-router-dom'
import { compose } from 'redux'

import HeroSection from '../layout/HeroSection'
import Main from '../layout/Main'
import MediationsManager from '../managers/MediationsManager'
import EventOccurrencesAndStocksManager from '../managers/EventOccurrencesAndStocksManager'
import eventSelector from '../../selectors/event'
import eventOccurrencesSelector from '../../selectors/eventOccurrences'
import eventOrThingPatchSelector from '../../selectors/eventOrThingPatch'
import offerSelector from '../../selectors/offer'
import offererSelector from '../../selectors/offerer'
import offerersSelector from '../../selectors/offerers'
import providersSelector from '../../selectors/providers'
import searchSelector from '../../selectors/search'
import stocksSelector from '../../selectors/stocks'
import thingSelector from '../../selectors/thing'
import typesSelector from '../../selectors/types'
import typeSelector from '../../selectors/type'
import venueSelector from '../../selectors/venue'
import venuesSelector from '../../selectors/venues'
import { offerNormalizer } from '../../utils/normalizers'
import { pluralize } from '../../utils/string'

const CONDITIONAL_FIELDS = {
  speaker: [
    'CONFERENCE_DEBAT_DEDICACE',
    'PRATIQUE_ARTISTIQUE_ABO',
    'PRATIQUE_ARTISTIQUE',
  ],
  author: ['CINEMA', 'MUSIQUE', 'SPECTACLE_VIVANT', 'LIVRE_EDITION'],
  visa: ['CINEMA'],
  isbn: ['LIVRE_EDITION'],
  musicType: ['MUSIQUE', 'MUSIQUE_ABO'],
  showType: ['SPECTACLE_VIVANT'],
  stageDirector: ['CINEMA', 'SPECTACLE_VIVANT'],
  performer: ['MUSIQUE', 'SPECTACLE_VIVANT'],
}

class OfferPage extends Component {
  constructor() {
    super()
    this.state = {
      isNew: false,
      isEventType: false,
      isOffererAndVenueSelectsReadOnly: true,
      isReadOnly: true,
    }
  }

  static getDerivedStateFromProps(nextProps) {
    const {
      location: { search },
      match: {
        params: { offerId },
      },
      offer,
      type,
    } = nextProps
    const { eventId, thingId } = offer || {}

    const isEdit = search.indexOf('modifie') > -1
    const isNew = offerId === 'nouveau'
    const isEventType = get(type, 'type') === 'Event' || eventId
    const isReadOnly = !isNew && !isEdit

    const apiPath = isEventType
      ? `events/${eventId || ''}`
      : `things/${thingId || ''}`

    return {
      apiPath,
      isEventType,
      isNew,
      isReadOnly,
    }
  }

  handleDataRequest = (handleSuccess, handleFail) => {
    const {
      history,
      dispatch,
      match: {
        params: { offerId },
      },
      providers,
      search,
      types,
    } = this.props

    if (offerId !== 'nouveau') {
      dispatch(
        requestData('GET', `offers/${offerId}`, {
          key: 'offers',
          normalizer: offerNormalizer,
        })
      )
    } else if (search.venueId) {
      requestData('GET', `venues/${search.venueId}`, {
        normalizer: {
          managingOffererId: 'offerers',
        },
      })
    } else {
      let offerersPath = 'offerers'
      if (search.offererId) {
        offerersPath = `${offerersPath}/${search.offererId}`
      }

      dispatch(
        requestData('GET', offerersPath, {
          handleSuccess: (state, action) => {
            if (!get(state, 'data.venues.length')) {
              dispatch(
                showModal(
                  <div>
                    Vous devez avoir déjà enregistré un lieu dans une de vos
                    structures pour ajouter des offres
                  </div>,
                  {
                    onCloseClick: () => history.push('/structures'),
                  }
                )
              )
            }
          },
          handleFail,
          normalizer: { managedVenues: 'venues' },
        })
      )
    }

    providers.length === 0 && dispatch(requestData('GET', 'providers'))
    types.length === 0 && dispatch(requestData('GET', 'types'))
    handleSuccess()
  }

  handleSuccess = (state, action) => {
    const { data, method } = action
    const { dispatch, history, offer, venue } = this.props

    dispatch(
      showNotification({
        text: 'Votre offre a bien été enregistrée',
        type: 'success',
      })
    )

    // PATCH
    if (method === 'PATCH') {
      history.push(`/offres/${offer.id}`)
      return
    }

    // POST
    if (method === 'POST') {
      const { offers } = data || {}
      const offer = offers && offers.find(o => o.venueId === get(venue, 'id'))
      if (!offer) {
        console.warn(
          'Something wrong with returned data, we should retrieve the created offer here'
        )
        return
      }
      history.push(`/offres/${offer.id}?gestion`)
    }
  }

  handleOffererRedirect = () => {
    const { history, offer, search } = this.props
    const venueId = get(offer, 'venueId')
    if (venueId && !search.venueId) {
      history.push(`/offres/${offer.id}?lieu=${venueId}`)
      return
    }
  }

  handleShowManagerModal = () => {
    const {
      hasEventOrThing,
      dispatch,
      location: { search },
    } = this.props
    search.indexOf('gestion') > -1
      ? hasEventOrThing &&
        dispatch(
          showModal(<EventOccurrencesAndStocksManager />, {
            isUnclosable: true,
          })
        )
      : dispatch(closeModal())
  }

  componentDidMount() {
    this.handleOffererRedirect()
    this.handleShowManagerModal()
  }

  componentDidUpdate(prevProps) {
    const {
      eventOccurrences,
      eventOrThingPatch,
      dispatch,
      hasEventOrThing,
      location: { pathname, search },
      offer,
      offerer,
      offerTypeError,
      type,
      venue,
    } = this.props

    if (search.indexOf('gestion') > -1) {
      if (
        prevProps.offer !== offer ||
        prevProps.eventOccurrences !== eventOccurrences ||
        prevProps.location.pathname !== pathname ||
        prevProps.location.search !== search ||
        (hasEventOrThing && !prevProps.hasEventOrThing)
      ) {
        this.handleShowManagerModal()
      }
    }

    if ((!offerer && prevProps.offerer) || (!type && prevProps.type)) {
      dispatch(
        mergeForm('offer', {
          offererId: null,
          venueId: null,
        })
      )
    }

    if (!venue && prevProps.venue) {
      dispatch(
        mergeForm('offer', {
          venueId: null,
        })
      )
    }

    if (get(eventOrThingPatch, 'type') && !type && !offerTypeError) {
      dispatch(
        mergeErrors('offer', {
          type: [
            'Il y a eu un problème avec la création de cette offre: son type est incompatible avec le lieu enregistré.',
          ],
        })
      )
    }
  }

  hasConditionalField(fieldName) {
    if (!this.props.type) {
      return false
    }

    return CONDITIONAL_FIELDS[fieldName].indexOf(this.props.type.value) > -1
  }

  render() {
    const {
      event,
      eventOccurrences,
      eventOrThingPatch,
      hasEventOrThing,
      location: { search },
      offer,
      offerer,
      offerers,
      stocks,
      thing,
      type,
      types,
      venue,
      venues,
      url,
      user,
      musicTypes,
      musicSubTypes,
      showTypes,
      showSubTypes,
    } = this.props
    const { apiPath, isNew, isReadOnly, isEventType } = this.state
    const eventOrThingName = get(event, 'name') || get(thing, 'name')
    const offerId = get(offer, 'id')
    const offererId = get(offerer, 'id')
    const showAllForm = type || !isNew
    const venueId = get(venue, 'id')

    const isOffererSelectReadOnly = typeof offererId !== 'undefined'
    const isVenueSelectReadOnly = typeof venueId !== 'undefined'

    let title
    if (isNew) {
      title = 'Ajouter une offre'
      if (venueId) {
        title = title + ` pour ${get(venue, 'name')}`
      } else if (offererId) {
        title = title + ` pour ${get(offerer, 'name')}`
      }
    } else {
      title = "Détails de l'offre"
    }

    return (
      <Main
        backTo={{ path: `/offres${search}`, label: 'Vos offres' }}
        name="offer"
        handleDataRequest={this.handleDataRequest}>
        <HeroSection
          subtitle={eventOrThingName && eventOrThingName.toUpperCase()}
          title={title}>
          <p className="subtitle">
            Renseignez les détails de cette offre, puis mettez-la en avant en
            ajoutant une ou plusieurs accroches.
          </p>

          <p className="subtitle">
            Attention : les offres payantes ne seront visibles auprès du public
            qu’à partir du début de l’expérimentation.
          </p>

          <Form
            action={apiPath}
            name="offer"
            handleSuccess={this.handleSuccess}
            patch={eventOrThingPatch}
            readOnly={isReadOnly}>
            <div className="field-group">
              <Field isExpanded label="Titre de l'offre" name="name" required />
              <Field
                label="Type"
                name="type"
                optionLabel="label"
                optionValue="value"
                options={types}
                placeholder={
                  get(eventOrThingPatch, 'type') && !type
                    ? get(eventOrThingPatch, 'type')
                    : "Sélectionnez un type d'offre"
                }
                required
                type="select"
              />
              {!isNew &&
                hasEventOrThing && (
                  <div className="field is-horizontal field-text">
                    <div className="field-label">
                      <label className="label" htmlFor="input_offers_name">
                        <div className="subtitle">
                          {isEventType ? 'Dates :' : 'Stocks :'}
                        </div>
                      </label>
                    </div>
                    <div className="field-body">
                      <div
                        className="control"
                        style={{ paddingTop: '0.25rem' }}>
                        <span
                          className="nb-dates"
                          style={{ paddingTop: '0.25rem' }}>
                          {pluralize(
                            get(
                              isEventType ? eventOccurrences : stocks,
                              'length'
                            ),
                            isEventType ? 'date' : 'stock'
                          )}
                        </span>
                        <NavLink
                          className="button is-primary is-outlined is-small"
                          to={`/offres/${offerId}?gestion`}>
                          <span className="icon">
                            <Icon svg="ico-calendar" />
                          </span>
                          <span>
                            {isEventType
                              ? 'Gérer les dates et les prix'
                              : 'Gérer les prix'}
                          </span>
                        </NavLink>
                      </div>
                    </div>
                  </div>
                )}
            </div>
            {!isNew && <MediationsManager />}
            {showAllForm && (
              <div>
                <h2 className="main-list-title">Infos pratiques</h2>
                <div className="field-group">
                  <Field
                    debug
                    label="Structure"
                    name="offererId"
                    options={offerers}
                    placeholder="Sélectionnez une structure"
                    readOnly={isOffererSelectReadOnly}
                    required
                    type="select"
                  />
                  {offerer && get(venues, 'length') === 0 ? (
                    <div className="field is-horizontal">
                      <div className="field-label" />
                      <div className="field-body">
                        <p className="help is-danger">
                          {venue
                            ? "Erreur dans les données: Le lieu rattaché à cette offre n'est pas compatible avec le type de l'offre"
                            : 'Il faut obligatoirement une structure avec un lieu.'}
                          <Field type="hidden" name="__BLOCK_FORM__" required />
                        </p>
                      </div>
                    </div>
                  ) : (
                    offerer &&
                    get(venues, 'length') > 0 && (
                      <Field
                        label="Lieu"
                        name="venueId"
                        options={venues}
                        placeholder="Sélectionnez un lieu"
                        readOnly={isVenueSelectReadOnly}
                        required
                        type="select"
                      />
                    )
                  )}
                  {(get(venue, 'isVirtual') || url) && (
                    <Field
                      isExpanded
                      label="URL"
                      name="url"
                      required
                      sublabel={
                        !isReadOnly &&
                        "Vous pouvez include {token} {email} et {offerId} dans l'URL, qui seront remplacés respectivement par le code de la contremarque, l'email de la personne ayant reservé et l'identifiant de l'offre"
                      }
                      type="text"
                    />
                  )}
                  {get(user, 'isAdmin') && (
                    <Field
                      label="Rayonnement national"
                      name="isNational"
                      type="checkbox"
                    />
                  )}
                  {isEventType && (
                    <Field
                      label="Durée en minutes"
                      name="durationMinutes"
                      required
                      type="number"
                    />
                  )}
                </div>
                <h2 className="main-list-title">Infos artistiques</h2>
                <div className="field-group">
                  <Field
                    displayMaxLength
                    isExpanded
                    label="Description"
                    maxLength={1000}
                    name="description"
                    rows={isReadOnly ? 1 : 5}
                    type="textarea"
                  />

                  {this.hasConditionalField('speaker') && (
                    <Field
                      type="text"
                      label="Intervenant"
                      name="speaker"
                      setKey="extraData"
                    />
                  )}

                  {this.hasConditionalField('author') && (
                    <Field
                      type="text"
                      label="Auteur"
                      name="author"
                      setKey="extraData"
                    />
                  )}

                  {this.hasConditionalField('visa') && (
                    <Field
                      type="text"
                      label="Visa d'exploitation (obligatoire si applicable)"
                      name="visa"
                      setKey="extraData"
                      isExpanded
                    />
                  )}

                  {this.hasConditionalField('isbn') && (
                    <Field
                      type="text"
                      label="ISBN (obligatoire si applicable)"
                      name="isbn"
                      setKey="extraData"
                      isExpanded
                    />
                  )}

                  {this.hasConditionalField('musicType') && (
                    <Fragment>
                      <Field
                        type="select"
                        label="Genre musical"
                        name="musicType"
                        setKey="extraData"
                        options={musicTypes}
                        optionValue="code"
                        optionLabel="label"
                      />

                      {musicSubTypes.length > 0 && (
                        <Field
                          type="select"
                          label="Sous genre"
                          name="musicSubType"
                          setKey="extraData"
                          options={musicSubTypes}
                          optionValue="code"
                          optionLabel="label"
                        />
                      )}
                    </Fragment>
                  )}

                  {this.hasConditionalField('showType') && (
                    <Fragment>
                      <Field
                        type="select"
                        label="Type de spectacle"
                        name="showType"
                        setKey="extraData"
                        options={showTypes}
                        optionValue="code"
                        optionLabel="label"
                      />

                      {showSubTypes.length > 0 && (
                        <Field
                          type="select"
                          label="Sous type"
                          name="showSubType"
                          setKey="extraData"
                          options={showSubTypes}
                          optionValue="code"
                          optionLabel="label"
                        />
                      )}
                    </Fragment>
                  )}

                  {this.hasConditionalField('stageDirector') && (
                    <Field
                      isExpanded
                      label="Metteur en scène"
                      name="stageDirector"
                      setKey="extraData"
                    />
                  )}

                  {this.hasConditionalField('performer') && (
                    <Field
                      isExpanded
                      label="Interprète"
                      name="performer"
                      setKey="extraData"
                    />
                  )}
                </div>
              </div>
            )}

            <hr />
            <div
              className="field is-grouped is-grouped-centered"
              style={{ justifyContent: 'space-between' }}>
              <div className="control">
                {isReadOnly ? (
                  <NavLink
                    to={`/offres/${offerId}?modifie`}
                    className="button is-secondary is-medium">
                    Modifier l'offre
                  </NavLink>
                ) : (
                  <CancelButton
                    className="button is-secondary is-medium"
                    to={isNew ? '/offres' : `/offres/${offerId}`}>
                    Annuler
                  </CancelButton>
                )}
              </div>
              <div className="control">
                {isReadOnly ? (
                  <NavLink to="/offres" className="button is-primary is-medium">
                    Terminer
                  </NavLink>
                ) : (
                  <SubmitButton className="button is-primary is-medium">
                    Enregistrer
                  </SubmitButton>
                )}
              </div>
            </div>
          </Form>
        </HeroSection>
      </Main>
    )
  }
}

export default compose(
  withLogin({ failRedirect: '/connexion' }),
  withRouter,
  connect((state, ownProps) => {
    const search = searchSelector(state, ownProps.location.search)

    const providers = providersSelector(state)

    const offerId = ownProps.match.params.offerId
    const offer = offerSelector(state, offerId)

    const eventId = get(offer, 'eventId')
    const event = eventSelector(state, eventId)

    const thingId = get(offer, 'thingId')
    const thing = thingSelector(state, thingId)

    const venueId = get(state, 'form.offer.venueId') || search.venueId

    const venue = venueSelector(state, venueId)

    const isVirtual = get(venue, 'isVirtual')
    const types = typesSelector(state, isVirtual)

    const typeValue =
      get(state, 'form.offer.type') || get(event, 'type') || get(thing, 'type')

    const type = typeSelector(state, isVirtual, typeValue)

    let offererId = get(state, 'form.offer.offererId') || search.offererId

    const venues = venuesSelector(state, offererId, type)

    offererId = offererId || get(venue, 'managingOffererId')

    const offerers = offerersSelector(state)
    const offerer = offererSelector(state, offererId)

    const eventOccurrences = eventOccurrencesSelector(state, offerId)

    const stocks = stocksSelector(state, offerId, event && eventOccurrences)

    const url =
      get(state, 'form.offer.url') || get(event, 'url') || get(thing, 'url')

    const user = state.user

    const hasEventOrThing = event || thing

    const eventOrThingPatch = eventOrThingPatchSelector(
      state,
      event,
      thing,
      offerer,
      venue
    )

    const extraData = get(state, 'form.offer.extraData') || {}

    const musicTypes = eddSelectors.musicTypeParentsSelector()

    let musicSubTypes = []
    if (extraData.musicType) {
      musicSubTypes = eddSelectors.musicTypeChildrenSelector(
        Number(extraData.musicType)
      )
    }

    const showTypes = eddSelectors.showTypeParentsSelector()

    let showSubTypes = []
    if (extraData.showType) {
      showSubTypes = eddSelectors.showTypeChildrenSelector(
        Number(extraData.showType)
      )
    }

    const offerTypeError = get(state, 'errors.offer.type')

    return {
      event,
      eventOccurrences,
      eventOrThingPatch,
      hasEventOrThing,
      musicTypes,
      musicSubTypes,
      providers,
      search,
      thing,
      offer,
      offerer,
      offerers,
      offerTypeError,
      showTypes,
      showSubTypes,
      stocks,
      types,
      type,
      url,
      user,
      venue,
      venues,
    }
  })
)(OfferPage)
