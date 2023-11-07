import { screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import React from 'react'
import { generatePath, Route, Routes } from 'react-router-dom'

import { api } from 'apiClient/api'
import { OFFER_WIZARD_STEP_IDS } from 'components/IndividualOfferBreadcrumb/constants'
import {
  IndividualOfferContext,
  IndividualOfferContextValues,
} from 'context/IndividualOfferContext'
import { OFFER_WIZARD_MODE } from 'core/Offers/constants'
import { IndividualOffer } from 'core/Offers/types'
import { getIndividualOfferPath } from 'core/Offers/utils/getIndividualOfferUrl'
import { ButtonLink } from 'ui-kit'
import { offerVenueFactory } from 'utils/apiFactories'
import {
  individualGetOfferStockResponseModelFactory,
  individualOfferContextFactory,
  individualOfferFactory,
} from 'utils/individualApiFactories'
import { renderWithProviders } from 'utils/renderWithProviders'

import StocksThing, { StocksThingProps } from '../StocksThing'

vi.mock('utils/date', async () => {
  return {
    ...((await vi.importActual('utils/date')) ?? {}),
    getToday: vi
      .fn()
      .mockImplementation(() => new Date('2020-12-15T12:00:00Z')),
  }
})

const offerId = 12

const renderStockThingScreen = (
  props: StocksThingProps,
  contextValue: IndividualOfferContextValues,
  url: string = generatePath(
    getIndividualOfferPath({
      step: OFFER_WIZARD_STEP_IDS.STOCKS,
      mode: OFFER_WIZARD_MODE.CREATION,
    }),
    { offerId: offerId }
  )
) =>
  renderWithProviders(
    <Routes>
      {Object.values(OFFER_WIZARD_MODE).map((mode) => (
        <Route
          key={mode}
          path={getIndividualOfferPath({
            step: OFFER_WIZARD_STEP_IDS.STOCKS,
            mode,
          })}
          element={
            <IndividualOfferContext.Provider value={contextValue}>
              <StocksThing {...props} />
              <ButtonLink link={{ to: '/outside', isExternal: false }}>
                Go outside !
              </ButtonLink>
            </IndividualOfferContext.Provider>
          }
        />
      ))}
      <Route path="/outside" element={<div>This is outside stock form</div>} />
    </Routes>,
    { initialRouterEntries: [url] }
  )

describe('screens:StocksThing', () => {
  let props: StocksThingProps
  let contextValue: IndividualOfferContextValues
  let offer: IndividualOffer

  beforeEach(() => {
    offer = individualOfferFactory({
      id: offerId,
      venue: offerVenueFactory({
        departementCode: '75',
      }),
      stocks: [],
    })
    props = {
      offer,
      stocks: [individualGetOfferStockResponseModelFactory()],
    }
    contextValue = individualOfferContextFactory()
  })

  it('should not block when going outside and form is not touched', async () => {
    vi.spyOn(api, 'upsertStocks').mockResolvedValue({
      stocks: [],
    })

    renderStockThingScreen(props, contextValue)

    await userEvent.click(screen.getByText('Go outside !'))

    expect(screen.getByText('This is outside stock form')).toBeInTheDocument()
  })

  it('should be able to stay on stock form after click on "Rester sur la page"', async () => {
    vi.spyOn(api, 'upsertStocks').mockResolvedValue({
      stocks: [],
    })

    renderStockThingScreen(props, contextValue)
    await userEvent.type(screen.getByLabelText('Quantité'), '20')

    await userEvent.click(screen.getByText('Go outside !'))

    await userEvent.click(screen.getByText('Rester sur la page'))

    expect(screen.getByTestId('stock-thing-form')).toBeInTheDocument()
  })

  it('should be able to quit without submitting from RouteLeavingGuard', async () => {
    vi.spyOn(api, 'upsertStocks').mockResolvedValue({
      stocks: [],
    })

    renderStockThingScreen(props, contextValue)
    await userEvent.type(screen.getByLabelText('Quantité'), '20')

    await userEvent.click(screen.getByText('Go outside !'))
    expect(
      screen.getByText('Les informations non enregistrées seront perdues')
    ).toBeInTheDocument()

    await userEvent.click(screen.getByText('Quitter la page'))
    expect(api.upsertStocks).toHaveBeenCalledTimes(0)

    expect(screen.getByText('This is outside stock form')).toBeInTheDocument()
  })
})
