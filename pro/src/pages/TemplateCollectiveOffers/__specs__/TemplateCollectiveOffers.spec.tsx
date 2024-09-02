import {
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

import { api } from 'apiClient/api'
import {
  CollectiveOfferDisplayedStatus,
  CollectiveOfferResponseModel,
  CollectiveOfferStatus,
  CollectiveOfferType,
  CollectiveOffersStockResponseModel,
} from 'apiClient/v1'
import {
  ALL_VENUES_OPTION,
  DEFAULT_COLLECTIVE_SEARCH_FILTERS,
} from 'core/Offers/constants'
import { CollectiveSearchFiltersParams } from 'core/Offers/types'
import { computeCollectiveOffersUrl } from 'core/Offers/utils/computeCollectiveOffersUrl'
import { collectiveOfferFactory } from 'utils/collectiveApiFactories'
import { venueListItemFactory } from 'utils/individualApiFactories'
import { renderWithProviders } from 'utils/renderWithProviders'
import { sharedCurrentUserFactory } from 'utils/storeFactories'

import { TemplateCollectiveOffers } from '../TemplateCollectiveOffers'

const proVenues = [
  venueListItemFactory({
    id: 1,
    name: 'Ma venue',
    offererName: 'Mon offerer',
    isVirtual: false,
  }),
  venueListItemFactory({
    id: 2,
    name: 'Ma venue virtuelle',
    offererName: 'Mon offerer',
    isVirtual: true,
  }),
]

const renderOffers = async (
  filters: Partial<CollectiveSearchFiltersParams> = DEFAULT_COLLECTIVE_SEARCH_FILTERS,
  features: string[] = []
) => {
  const route = computeCollectiveOffersUrl(filters)

  renderWithProviders(<TemplateCollectiveOffers />, {
    user: sharedCurrentUserFactory(),
    initialRouterEntries: [route],
    features: features,
  })

  await waitForElementToBeRemoved(() => screen.queryByTestId('spinner'))
}

describe('route TemplateCollectiveOffers', () => {
  let offersRecap: CollectiveOfferResponseModel[]
  const stocks: Array<CollectiveOffersStockResponseModel> = [
    {
      beginningDatetime: String(new Date()),
      hasBookingLimitDatetimePassed: false,
      remainingQuantity: 1,
    },
  ]

  beforeEach(() => {
    offersRecap = [collectiveOfferFactory({ stocks })]
    vi.spyOn(api, 'getCollectiveOffers').mockResolvedValue(offersRecap)
    vi.spyOn(api, 'listOfferersNames').mockResolvedValue({ offerersNames: [] })
    vi.spyOn(api, 'getVenues').mockResolvedValue({ venues: proVenues })
  })

  describe('filters', () => {
    describe('status filters', () => {
      it('should filter offers given status filter when clicking on "Appliquer"', async () => {
        vi.spyOn(api, 'getCollectiveOffers').mockResolvedValueOnce(offersRecap)
        await renderOffers()

        await userEvent.click(
          screen.getByText('Statut', {
            selector: 'span',
          })
        )
        const list = screen.getByTestId('list')
        await userEvent.click(within(list).getByText('Refusée'))

        await userEvent.click(
          screen.getByRole('button', { name: 'Rechercher' })
        )

        await waitFor(() => {
          expect(api.getCollectiveOffers).toHaveBeenLastCalledWith(
            undefined,
            undefined,
            CollectiveOfferDisplayedStatus.REJECTED,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            CollectiveOfferType.TEMPLATE,
            undefined
          )
        })
      })

      it('should filter offers given multiple status filter when clicking on "Appliquer"', async () => {
        vi.spyOn(api, 'getCollectiveOffers').mockResolvedValueOnce(offersRecap)
        await renderOffers()

        await userEvent.click(
          screen.getByText('Statut', {
            selector: 'span',
          })
        )
        const list = screen.getByTestId('list')
        await userEvent.click(within(list).getByText('Refusée'))
        await userEvent.click(within(list).getByText('Archivée'))

        await userEvent.click(
          screen.getByRole('button', { name: 'Rechercher' })
        )

        await waitFor(() => {
          expect(api.getCollectiveOffers).toHaveBeenLastCalledWith(
            undefined,
            undefined,
            [
              CollectiveOfferDisplayedStatus.REJECTED,
              CollectiveOfferDisplayedStatus.ARCHIVED,
            ],
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            CollectiveOfferType.TEMPLATE,
            undefined
          )
        })
      })

      it('should indicate that no offers match selected filters', async () => {
        vi.spyOn(api, 'getCollectiveOffers')
          .mockResolvedValueOnce(offersRecap)
          .mockResolvedValueOnce([])
        await renderOffers()

        await userEvent.click(
          screen.getByText('Statut', {
            selector: 'span',
          })
        )
        const list = screen.getByTestId('list')
        await userEvent.click(within(list).getByText('Masquée sur ADAGE'))

        await userEvent.click(
          screen.getByRole('button', { name: 'Rechercher' })
        )

        await waitFor(() => {
          expect(
            screen.getByText('Aucune offre trouvée pour votre recherche')
          ).toBeInTheDocument()
        })
      })

      it('should not display column titles when no offers are returned', async () => {
        vi.spyOn(api, 'getCollectiveOffers').mockResolvedValueOnce([])

        await renderOffers()

        expect(screen.queryByText('Lieu', { selector: 'th' })).toBeNull()
        expect(screen.queryByText('Stock', { selector: 'th' })).toBeNull()
      })
    })

    describe('on click on search button', () => {
      it('should load offers with written offer name filter', async () => {
        await renderOffers()
        await userEvent.type(
          screen.getByPlaceholderText('Rechercher par nom d’offre'),
          'Any word'
        )

        await userEvent.click(screen.getByText('Rechercher'))
        await waitFor(() => {
          expect(api.getCollectiveOffers).toHaveBeenCalledWith(
            'Any word',
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            CollectiveOfferType.TEMPLATE,
            undefined
          )
        })
      })

      it('should load offers with selected venue filter', async () => {
        await renderOffers()
        const firstVenueOption = screen.getByRole('option', {
          name: proVenues[0].name,
        })
        const venueSelect = screen.getByLabelText('Lieu')
        await userEvent.selectOptions(venueSelect, firstVenueOption)

        await userEvent.click(screen.getByText('Rechercher'))
        await waitFor(() => {
          expect(api.getCollectiveOffers).toHaveBeenCalledWith(
            undefined,
            undefined,
            undefined,
            proVenues[0].id.toString(),
            undefined,
            undefined,
            undefined,
            undefined,
            CollectiveOfferType.TEMPLATE,
            undefined
          )
        })
      })

      it('should load offers with selected period beginning date', async () => {
        await renderOffers()

        await userEvent.type(
          screen.getByLabelText('Début de la période'),
          '2020-12-25'
        )

        await userEvent.click(screen.getByText('Rechercher'))
        await waitFor(() => {
          expect(api.getCollectiveOffers).toHaveBeenLastCalledWith(
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            '2020-12-25',
            undefined,
            CollectiveOfferType.TEMPLATE,
            undefined
          )
        })
      })

      it('should load offers with selected period ending date', async () => {
        await renderOffers()
        await userEvent.type(
          screen.getByLabelText('Fin de la période'),
          '2020-12-27'
        )

        await userEvent.click(screen.getByText('Rechercher'))
        await waitFor(() => {
          expect(api.getCollectiveOffers).toHaveBeenLastCalledWith(
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            '2020-12-27',
            CollectiveOfferType.TEMPLATE,
            undefined
          )
        })
      })
    })
  })

  describe('page navigation', () => {
    it('should display next page when clicking on right arrow', async () => {
      const offers = Array.from({ length: 11 }, () =>
        collectiveOfferFactory({ stocks })
      )
      vi.spyOn(api, 'getCollectiveOffers').mockResolvedValueOnce(offers)
      await renderOffers()
      const nextIcon = screen.getByRole('button', { name: 'Page suivante' })

      await userEvent.click(nextIcon)

      expect(api.getCollectiveOffers).toHaveBeenCalledTimes(1)
      expect(screen.getByLabelText(offers[10].name)).toBeInTheDocument()
      expect(screen.queryByText(offers[0].name)).not.toBeInTheDocument()
    })

    it('should display previous page when clicking on left arrow', async () => {
      const offers = Array.from({ length: 11 }, () =>
        collectiveOfferFactory({ stocks })
      )
      vi.spyOn(api, 'getCollectiveOffers').mockResolvedValueOnce(offers)
      await renderOffers()
      const nextIcon = screen.getByRole('button', { name: 'Page suivante' })
      const previousIcon = screen.getByRole('button', {
        name: 'Page précédente',
      })
      await userEvent.click(nextIcon)

      await userEvent.click(previousIcon)

      expect(api.getCollectiveOffers).toHaveBeenCalledTimes(1)
      expect(screen.getByLabelText(offers[0].name)).toBeInTheDocument()
      expect(screen.queryByText(offers[10].name)).not.toBeInTheDocument()
    })

    describe('when 501 offers are fetched', () => {
      beforeEach(() => {
        offersRecap = Array.from({ length: 501 }, () =>
          collectiveOfferFactory({ stocks })
        )
      })

      it('should have max number page of 50', async () => {
        vi.spyOn(api, 'getCollectiveOffers').mockResolvedValueOnce(offersRecap)

        await renderOffers()

        expect(screen.getByText('Page 1/50')).toBeInTheDocument()
      })

      it('should not display the 501st offer', async () => {
        vi.spyOn(api, 'getCollectiveOffers').mockResolvedValueOnce(offersRecap)
        await renderOffers()
        const nextIcon = screen.getByRole('button', { name: 'Page suivante' })

        for (let i = 1; i < 51; i++) {
          await userEvent.click(nextIcon)
        }

        expect(screen.getByLabelText(offersRecap[499].name)).toBeInTheDocument()
        expect(
          screen.queryByText(offersRecap[500].name)
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('should reset filters', () => {
    it('when clicking on "afficher toutes les offres" when no offers are displayed', async () => {
      vi.spyOn(api, 'getCollectiveOffers')
        .mockResolvedValueOnce(offersRecap)
        .mockResolvedValueOnce([])
      // 3rd call is not made if filters are strictly the same
      const filters = {
        venueId: '666',
      }
      await renderOffers(filters)

      const firstVenueOption = screen.getByRole('option', {
        name: proVenues[0].name,
      })

      const venueSelect = screen.getByDisplayValue(ALL_VENUES_OPTION.label)

      await userEvent.selectOptions(venueSelect, firstVenueOption)

      expect(api.getCollectiveOffers).toHaveBeenCalledTimes(1)
      expect(api.getCollectiveOffers).toHaveBeenNthCalledWith(
        1,
        undefined,
        undefined,
        undefined,
        '666',
        undefined,
        undefined,
        undefined,
        undefined,
        CollectiveOfferType.TEMPLATE,
        undefined
      )

      await userEvent.click(screen.getByText('Rechercher'))
      await waitFor(() => {
        expect(api.getCollectiveOffers).toHaveBeenCalledTimes(2)
      })
      expect(api.getCollectiveOffers).toHaveBeenNthCalledWith(
        2,
        undefined,
        undefined,
        undefined,
        proVenues[0].id.toString(),
        undefined,
        undefined,
        undefined,
        undefined,
        CollectiveOfferType.TEMPLATE,
        undefined
      )

      screen.getByText('Aucune offre trouvée pour votre recherche')

      await userEvent.click(screen.getByText('Afficher toutes les offres'))
      await waitFor(() => {
        expect(api.getCollectiveOffers).toHaveBeenCalledTimes(3)
      })
      expect(api.getCollectiveOffers).toHaveBeenNthCalledWith(
        3,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        CollectiveOfferType.TEMPLATE,
        undefined
      )
    })

    it('when clicking on "Réinitialiser les filtres"', async () => {
      vi.spyOn(api, 'getCollectiveOffers')
        .mockResolvedValueOnce(offersRecap)
        .mockResolvedValueOnce([])
      // 3rd call is not made if filters are strictly the same
      const filters = {
        venueId: '666',
      }

      await renderOffers(filters)

      const venueOptionToSelect = screen.getByRole('option', {
        name: proVenues[0].name,
      })

      const venueSelect = screen.getByDisplayValue(ALL_VENUES_OPTION.label)

      await userEvent.selectOptions(venueSelect, venueOptionToSelect)

      expect(api.getCollectiveOffers).toHaveBeenCalledTimes(1)
      expect(api.getCollectiveOffers).toHaveBeenNthCalledWith(
        1,
        undefined,
        undefined,
        undefined,
        '666',
        undefined,
        undefined,
        undefined,
        undefined,
        CollectiveOfferType.TEMPLATE,
        undefined
      )

      await userEvent.click(screen.getByText('Rechercher'))
      await waitFor(() => {
        expect(api.getCollectiveOffers).toHaveBeenCalledTimes(2)
      })
      expect(api.getCollectiveOffers).toHaveBeenNthCalledWith(
        2,
        undefined,
        undefined,
        undefined,
        proVenues[0].id.toString(),
        undefined,
        undefined,
        undefined,
        undefined,
        CollectiveOfferType.TEMPLATE,
        undefined
      )

      await userEvent.click(screen.getByText('Réinitialiser les filtres'))
      await waitFor(() => {
        expect(api.getCollectiveOffers).toHaveBeenCalledTimes(3)
      })
      expect(api.getCollectiveOffers).toHaveBeenNthCalledWith(
        3,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        CollectiveOfferType.TEMPLATE,
        undefined
      )
    })
  })

  it('should show all offers if the WIP_ENABLE_COLLECTIVE_DRAFT_OFFERS FF is enabled', async () => {
    vi.spyOn(api, 'getCollectiveOffers').mockResolvedValueOnce([
      collectiveOfferFactory({ status: CollectiveOfferStatus.ACTIVE }),
      collectiveOfferFactory({ status: CollectiveOfferStatus.DRAFT }),
    ])
    await renderOffers(DEFAULT_COLLECTIVE_SEARCH_FILTERS, [
      'WIP_ENABLE_COLLECTIVE_DRAFT_OFFERS',
    ])

    expect(screen.getByText('2 offres')).toBeInTheDocument()
  })

  it('should not show draft offers if the WIP_ENABLE_COLLECTIVE_DRAFT_OFFERS FF is disabled', async () => {
    vi.spyOn(api, 'getCollectiveOffers').mockResolvedValueOnce([
      collectiveOfferFactory({ status: CollectiveOfferStatus.ACTIVE }),
      collectiveOfferFactory({ status: CollectiveOfferStatus.DRAFT }),
    ])
    await renderOffers(DEFAULT_COLLECTIVE_SEARCH_FILTERS)

    expect(screen.getByText('1 offre')).toBeInTheDocument()
  })
})