import { screen } from '@testing-library/react'
import React from 'react'

import { renderWithProviders } from 'commons/utils/renderWithProviders'

import { MostViewedOffers, MostViewedOffersProps } from '../MostViewedOffers'

const renderCumulatedViews = (props: MostViewedOffersProps) =>
  renderWithProviders(<MostViewedOffers {...props} />)

describe('MostViewedOffers', () => {
  it('should render empty state when no views data', () => {
    renderCumulatedViews({
      topOffers: [
        { offerId: 1, offerName: 'offer 1', numberOfViews: 100 },
        { offerId: 2, offerName: 'offer 2', numberOfViews: 200 },
        { offerId: 3, offerName: 'offer 3', numberOfViews: 300 },
      ],
      last30daysViews: 1000,
    })

    expect(screen.getByText(/1 000 fois/)).toBeInTheDocument()
  })
})
