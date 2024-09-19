import { SortingMode } from 'hooks/useColumnSorting'
import { CollectiveOffersSortingColumn } from 'screens/CollectiveOffersScreen/CollectiveOffersScreen'
import { collectiveOfferFactory } from 'utils/collectiveApiFactories'
import { sortCollectiveOffers } from 'utils/sortCollectiveOffers'

describe('sortCollectiveOffers', () => {
  it('should sort collective offers in a descending order', () => {
    const offers = [
      collectiveOfferFactory({
        id: 1,
        dates: { start: '2024-07-15T00:00:00Z', end: '2024-08-15T00:00:00Z' },
      }),
      collectiveOfferFactory({
        id: 2,
        dates: { start: '2024-07-16T00:00:00Z', end: '2024-08-15T00:00:00Z' },
      }),
    ]
    const sortedOffers = sortCollectiveOffers(
      offers,
      CollectiveOffersSortingColumn.EVENT_DATE,
      SortingMode.DESC
    )

    expect(sortedOffers[0].id).toEqual(2)
  })

  it('should sort collective offers in a ascending order', () => {
    const offers = [
      collectiveOfferFactory({
        id: 1,
        dates: { start: '2024-07-15T00:00:00Z', end: '2024-08-15T00:00:00Z' },
      }),
      collectiveOfferFactory({
        id: 2,
        dates: { start: '2024-07-16T00:00:00Z', end: '2024-08-15T00:00:00Z' },
      }),
    ]
    const sortedOffers = sortCollectiveOffers(
      offers,
      CollectiveOffersSortingColumn.EVENT_DATE,
      SortingMode.ASC
    )

    expect(sortedOffers[0].id).toEqual(1)
  })

  it('should not sort offers if the column sort is not defined', () => {
    const offers = [
      collectiveOfferFactory({
        id: 1,
        dates: { start: '2024-07-15T00:00:00Z', end: '2024-08-15T00:00:00Z' },
      }),
      collectiveOfferFactory({
        id: 2,
        dates: { start: '2024-07-16T00:00:00Z', end: '2024-08-15T00:00:00Z' },
      }),
    ]
    const sortedOffersAsc = sortCollectiveOffers(offers, null, SortingMode.ASC)
    const sortedOffersDesc = sortCollectiveOffers(
      offers,
      null,
      SortingMode.DESC
    )

    expect(sortedOffersAsc[0].id).toEqual(1)
    expect(sortedOffersDesc[0].id).toEqual(1)
  })

  it('should not sort offers if the dates do not exist', () => {
    const offers = [
      collectiveOfferFactory({
        id: 1,
        dates: undefined,
      }),
      collectiveOfferFactory({
        id: 2,
        dates: undefined,
      }),
    ]
    const sortedOffersAsc = sortCollectiveOffers(
      offers,
      CollectiveOffersSortingColumn.EVENT_DATE,
      SortingMode.ASC
    )
    const sortedOffersDesc = sortCollectiveOffers(
      offers,
      CollectiveOffersSortingColumn.EVENT_DATE,
      SortingMode.DESC
    )

    expect(sortedOffersAsc[0].id).toEqual(1)
    expect(sortedOffersDesc[0].id).toEqual(1)
  })
})