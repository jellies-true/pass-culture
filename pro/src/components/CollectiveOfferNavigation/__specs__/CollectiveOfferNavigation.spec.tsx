import { screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import React from 'react'
import * as router from 'react-router-dom'

import { ApiRequestOptions } from 'apiClient/adage/core/ApiRequestOptions'
import { ApiResult } from 'apiClient/adage/core/ApiResult'
import { api } from 'apiClient/api'
import {
  ApiError,
  CollectiveOfferResponseIdModel,
  CollectiveOfferStatus,
  GetCollectiveOfferResponseModel,
  GetCollectiveOfferTemplateResponseModel,
} from 'apiClient/v1'
import * as useAnalytics from 'app/App/analytics/firebase'
import {
  Events,
  OFFER_FROM_TEMPLATE_ENTRIES,
} from 'core/FirebaseEvents/constants'
import { SENT_DATA_ERROR_MESSAGE } from 'core/shared/constants'
import * as useNotification from 'hooks/useNotification'
import {
  defaultGetVenue,
  getCollectiveOfferFactory,
  getCollectiveOfferTemplateFactory,
} from 'utils/collectiveApiFactories'
import { renderWithProviders } from 'utils/renderWithProviders'
import { sharedCurrentUserFactory } from 'utils/storeFactories'

import {
  CollectiveOfferNavigation,
  CollectiveOfferNavigationProps,
  CollectiveOfferStep,
} from '../CollectiveOfferNavigation'

const renderCollectiveOfferNavigation = (
  props: CollectiveOfferNavigationProps
) =>
  renderWithProviders(<CollectiveOfferNavigation {...props} />, {
    storeOverrides: {
      user: {
        currentUser: sharedCurrentUserFactory(),
        selectedOffererId: 1,
      },
    },
  })

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useLocation: vi.fn(),
}))

describe('CollectiveOfferNavigation', () => {
  let offer:
    | GetCollectiveOfferTemplateResponseModel
    | GetCollectiveOfferResponseModel
  let props: CollectiveOfferNavigationProps
  const offerId = 1
  const mockLogEvent = vi.fn()
  const notifyError = vi.fn()
  const notifySuccess = vi.fn()
  const defaultUseLocationValue = {
    state: {},
    hash: '',
    key: '',
    pathname: '',
    search: '',
  }

  beforeEach(async () => {
    offer = getCollectiveOfferTemplateFactory({ isTemplate: true })
    vi.spyOn(useAnalytics, 'useAnalytics').mockImplementation(() => ({
      logEvent: mockLogEvent,
    }))

    vi.spyOn(api, 'getCollectiveOfferTemplate').mockResolvedValue(offer)

    vi.spyOn(api, 'getVenue').mockResolvedValue(defaultGetVenue)

    vi.spyOn(api, 'getCollectiveOfferTemplate').mockResolvedValue(offer)

    vi.spyOn(api, 'listEducationalOfferers').mockResolvedValue({
      educationalOfferers: [],
    })

    vi.spyOn(api, 'listEducationalDomains').mockResolvedValue([])
    vi.spyOn(api, 'getNationalPrograms').mockResolvedValue([])

    vi.spyOn(api, 'createCollectiveOffer').mockResolvedValue(
      {} as CollectiveOfferResponseIdModel
    )

    const notifsImport = (await vi.importActual(
      'hooks/useNotification'
    )) as ReturnType<typeof useNotification.useNotification>
    vi.spyOn(useNotification, 'useNotification').mockImplementation(() => ({
      ...notifsImport,
      error: notifyError,
      success: notifySuccess,
    }))

    vi.spyOn(router, 'useLocation').mockReturnValue(defaultUseLocationValue)

    props = {
      activeStep: CollectiveOfferStep.DETAILS,
      isCreatingOffer: true,
      offerId: offerId,
      isTemplate: false,
    }
  })

  it('should display navigation for collective offer in creation', async () => {
    props.offerId = 0
    renderCollectiveOfferNavigation(props)

    expect(screen.getByTestId('stepper')).toBeInTheDocument()

    const listItems = await screen.findAllByRole('listitem')

    expect(listItems).toHaveLength(6)
    expect(listItems[0]).toHaveTextContent('Détails de l’offre')
    expect(listItems[1]).toHaveTextContent('Dates et prix')
    expect(listItems[2]).toHaveTextContent('Établissement et enseignant')
    expect(listItems[3]).toHaveTextContent('Récapitulatif')
    expect(listItems[4]).toHaveTextContent('Aperçu')
    expect(listItems[5]).toHaveTextContent('Confirmation')

    const links = screen.queryAllByRole('link')
    expect(links).toHaveLength(0)
  })

  it('should show different links if offer is template', async () => {
    props.isTemplate = true
    props.activeStep = CollectiveOfferStep.SUMMARY
    renderCollectiveOfferNavigation(props)

    const listItems = await screen.findAllByRole('listitem')
    expect(listItems).toHaveLength(4)
    expect(screen.queryByText('Dates et prix')).not.toBeInTheDocument()
    expect(screen.queryByText('Visibilité')).not.toBeInTheDocument()

    const links = screen.queryAllByRole('link')
    expect(links).toHaveLength(1)
    expect(links[0].getAttribute('href')).toBe(
      `/offre/collectif/vitrine/${offerId}/creation`
    )
  })

  it('should show links if stocks is the active step', () => {
    props.activeStep = CollectiveOfferStep.STOCKS
    renderCollectiveOfferNavigation(props)
    const links = screen.queryAllByRole('link')
    expect(links).toHaveLength(2)
    expect(links[0].getAttribute('href')).toBe(
      `/offre/collectif/${offerId}/creation`
    )
    expect(links[1].getAttribute('href')).toBe(
      `/offre/${offerId}/collectif/stocks`
    )
  })

  it('should show links if visibility is the active step', () => {
    props.activeStep = CollectiveOfferStep.VISIBILITY
    renderCollectiveOfferNavigation(props)
    const links = screen.queryAllByRole('link')
    expect(links).toHaveLength(2)
    expect(links[0].getAttribute('href')).toBe(
      `/offre/collectif/${offerId}/creation`
    )
    expect(links[1].getAttribute('href')).toBe(
      `/offre/${offerId}/collectif/stocks`
    )
  })

  it('should show links if summary is the active step', () => {
    props.activeStep = CollectiveOfferStep.SUMMARY
    renderCollectiveOfferNavigation(props)
    const links = screen.queryAllByRole('link')
    expect(links).toHaveLength(3)
    expect(links[0].getAttribute('href')).toBe(
      `/offre/collectif/${offerId}/creation`
    )
    expect(links[1].getAttribute('href')).toBe(
      `/offre/${offerId}/collectif/stocks`
    )
    expect(links[2].getAttribute('href')).toBe(
      `/offre/${offerId}/collectif/visibilite`
    )
  })

  it('should show links if confirmation is the active step', () => {
    props.activeStep = CollectiveOfferStep.CONFIRMATION
    renderCollectiveOfferNavigation(props)
    const links = screen.queryAllByRole('link')
    expect(links).toHaveLength(5)
    expect(links[0].getAttribute('href')).toBe(
      `/offre/collectif/${offerId}/creation`
    )
    expect(links[1].getAttribute('href')).toBe(
      `/offre/${offerId}/collectif/stocks`
    )
    expect(links[2].getAttribute('href')).toBe(
      `/offre/${offerId}/collectif/visibilite`
    )
    expect(links[3].getAttribute('href')).toBe(
      `/offre/${offerId}/collectif/creation/recapitulatif`
    )
  })

  it('should show links if confirmation is the active step and the offer is template', () => {
    props.activeStep = CollectiveOfferStep.CONFIRMATION
    renderCollectiveOfferNavigation({ ...props, isTemplate: true })
    const links = screen.queryAllByRole('link')
    expect(links).toHaveLength(3)
  })

  it('should generate links with offerId when user is editing an offer', async () => {
    vi.spyOn(router, 'useLocation').mockReturnValueOnce({
      ...defaultUseLocationValue,
      pathname: '/offre/${offerId}/collectif/edition',
    })
    props.isCreatingOffer = false
    renderCollectiveOfferNavigation(props)

    const linkItems = await screen.findAllByRole('link')

    expect(linkItems).toHaveLength(5)
    expect(linkItems[0].getAttribute('href')).toBe(
      `/offre/${offerId}/collectif/edition`
    )
    expect(linkItems[1].getAttribute('href')).toBe(
      `/offre/${offerId}/collectif/apercu`
    )
    expect(linkItems[2].getAttribute('href')).toBe(
      `/offre/${offerId}/collectif/edition`
    )
    expect(linkItems[3].getAttribute('href')).toBe(
      `/offre/${offerId}/collectif/stocks/edition`
    )
    expect(linkItems[4].getAttribute('href')).toBe(
      `/offre/${offerId}/collectif/visibilite/edition`
    )
  })

  it('should log event when clicking duplicate offer button', async () => {
    renderCollectiveOfferNavigation({
      ...props,
      isTemplate: true,
      isCreatingOffer: false,
    })

    const duplicateOffer = screen.getByRole('button', {
      name: 'Créer une offre réservable',
    })
    await userEvent.click(duplicateOffer)

    expect(mockLogEvent).toHaveBeenNthCalledWith(
      1,
      Events.CLICKED_DUPLICATE_TEMPLATE_OFFER,
      {
        from: OFFER_FROM_TEMPLATE_ENTRIES.OFFER_TEMPLATE_RECAP,
        offererId: '1',
        offerId: 1,
        offerType: 'collective',
      }
    )
  })

  it('should show create bookable offer if offer is template in edition', () => {
    renderCollectiveOfferNavigation({
      ...props,
      isTemplate: true,
      isCreatingOffer: false,
    })

    const duplicateOffer = screen.getByRole('button', {
      name: 'Créer une offre réservable',
    })

    expect(duplicateOffer).toBeInTheDocument()
  })

  it('should return an error when the collective offer could not be retrieved', async () => {
    vi.spyOn(api, 'getCollectiveOfferTemplate').mockRejectedValueOnce('')

    renderCollectiveOfferNavigation({
      ...props,
      isTemplate: true,
      isCreatingOffer: false,
    })

    const duplicateOffer = screen.getByRole('button', {
      name: 'Créer une offre réservable',
    })
    await userEvent.click(duplicateOffer)

    expect(notifyError).toHaveBeenCalledWith(
      'Une erreur est survenue lors de la récupération de votre offre'
    )
  })

  it('should return an error when the duplication failed', async () => {
    vi.spyOn(api, 'getCollectiveOfferTemplate').mockResolvedValueOnce(
      getCollectiveOfferTemplateFactory({ isTemplate: true, isActive: true })
    )
    vi.spyOn(api, 'createCollectiveOffer').mockRejectedValueOnce(
      new ApiError({} as ApiRequestOptions, { status: 400 } as ApiResult, '')
    )

    renderCollectiveOfferNavigation({
      ...props,
      isTemplate: true,
      isCreatingOffer: false,
    })

    const duplicateOffer = screen.getByRole('button', {
      name: 'Créer une offre réservable',
    })

    await userEvent.click(duplicateOffer)

    expect(notifyError).toHaveBeenCalledWith(SENT_DATA_ERROR_MESSAGE)
  })

  it('should return an error when trying to get offerer image', async () => {
    fetchMock.mockResponse('Service Unavailable', { status: 503 })

    renderCollectiveOfferNavigation({
      ...props,
      isTemplate: true,
      isCreatingOffer: false,
    })

    const duplicateOffer = screen.getByRole('button', {
      name: 'Créer une offre réservable',
    })

    await userEvent.click(duplicateOffer)

    expect(notifyError).toHaveBeenCalledWith('Impossible de dupliquer l’image')
  })

  it('should archive an offer template', async () => {
    renderCollectiveOfferNavigation({
      ...props,
      isTemplate: true,
      isCreatingOffer: false,
      isArchivable: true,
    })

    const archiveButton = screen.getByRole('button', {
      name: 'Archiver',
    })

    await userEvent.click(archiveButton)
    const confirmArchivingButton = screen.getByText('Archiver l’offre')
    await userEvent.click(confirmArchivingButton)

    expect(notifySuccess).toHaveBeenCalledWith(
      'Une offre a bien été archivée',
      {
        duration: 8000,
      }
    )
  })

  it('should archive an offer bookable', async () => {
    renderCollectiveOfferNavigation({
      ...props,
      isTemplate: false,
      isCreatingOffer: false,
      isArchivable: true,
    })

    const archiveButton = screen.getByRole('button', {
      name: 'Archiver',
    })

    await userEvent.click(archiveButton)
    const confirmArchivingButton = screen.getByText('Archiver l’offre')
    await userEvent.click(confirmArchivingButton)

    expect(notifySuccess).toHaveBeenCalledWith(
      'Une offre a bien été archivée',
      {
        duration: 8000,
      }
    )
  })

  it('should not see archive button when offer is not archivable', () => {
    renderCollectiveOfferNavigation({
      ...props,
      isTemplate: true,
      isCreatingOffer: false,
      isArchivable: false,
    })

    const archiveButton = screen.queryByRole('button', {
      name: 'Archiver',
    })

    expect(archiveButton).not.to.toBeInTheDocument()
  })

  it('should return an error on offer archiving when the offer id is not valid', async () => {
    renderCollectiveOfferNavigation({
      ...props,
      offerId: undefined,
      isTemplate: true,
      isCreatingOffer: false,
      isArchivable: true,
    })

    const archiveButton = screen.getByRole('button', {
      name: 'Archiver',
    })

    await userEvent.click(archiveButton)
    const confirmArchivingButton = screen.getByText('Archiver l’offre')
    await userEvent.click(confirmArchivingButton)

    expect(notifyError).toHaveBeenNthCalledWith(
      1,
      'L’identifiant de l’offre n’est pas valide.'
    )
  })

  it('should return an error on offer archiving when there is an api error', async () => {
    renderCollectiveOfferNavigation({
      ...props,
      isTemplate: true,
      isCreatingOffer: false,
      isArchivable: true,
    })

    vi.spyOn(api, 'patchCollectiveOffersTemplateArchive').mockRejectedValueOnce(
      {}
    )

    const archiveButton = screen.getByRole('button', {
      name: 'Archiver',
    })

    await userEvent.click(archiveButton)
    const confirmArchivingButton = screen.getByText('Archiver l’offre')
    await userEvent.click(confirmArchivingButton)

    expect(notifyError).toHaveBeenCalledWith(
      'Une erreur est survenue lors de l’archivage de l’offre',
      {
        duration: 8000,
      }
    )
  })

  it('should not display the edition button for archived collective offers', () => {
    renderCollectiveOfferNavigation({
      ...props,
      offerId: 1,
      isCreatingOffer: false,
      isTemplate: false,
      offer: getCollectiveOfferFactory({
        status: CollectiveOfferStatus.ARCHIVED,
      }),
    })

    expect(
      screen.queryByRole('link', { name: 'Modifier l’offre' })
    ).not.toBeInTheDocument()
  })

  it('should not display the navigation for archived collective offers', () => {
    renderCollectiveOfferNavigation({
      ...props,
      offerId: 1,
      isCreatingOffer: false,
      isTemplate: false,
      offer: getCollectiveOfferFactory({
        status: CollectiveOfferStatus.ARCHIVED,
      }),
    })

    expect(screen.queryByTestId('stepper')).not.toBeInTheDocument()
  })
})
