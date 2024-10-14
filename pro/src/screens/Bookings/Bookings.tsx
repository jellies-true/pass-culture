import isEqual from 'lodash.isequal'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import useSWR from 'swr'

import { api } from 'apiClient/api'
import {
  BookingRecapResponseModel,
  BookingStatusFilter,
  CollectiveBookingResponseModel,
} from 'apiClient/v1'
import { useAnalytics } from 'app/App/analytics/firebase'
import {
  GET_BOOKINGS_QUERY_KEY,
  GET_HAS_BOOKINGS_QUERY_KEY,
  GET_OFFERER_ADDRESS_QUERY_KEY,
  GET_VENUES_QUERY_KEY,
} from 'commons/config/swrQueryKeys'
import { DEFAULT_PRE_FILTERS } from 'commons/core/Bookings/constants'
import { PreFiltersParams } from 'commons/core/Bookings/types'
import { Events } from 'commons/core/FirebaseEvents/constants'
import { Audience } from 'commons/core/shared/types'
import { useCurrentUser } from 'commons/hooks/useCurrentUser'
import { useIsNewInterfaceActive } from 'commons/hooks/useIsNewInterfaceActive'
import { useNotification } from 'commons/hooks/useNotification'
import { selectCurrentOffererId } from 'commons/store/user/selectors'
import { NoData } from 'components/NoData/NoData'
import strokeLibraryIcon from 'icons/stroke-library.svg'
import strokeUserIcon from 'icons/stroke-user.svg'
import { ChoosePreFiltersMessage } from 'pages/Bookings/ChoosePreFiltersMessage/ChoosePreFiltersMessage'
import { NoBookingsForPreFiltersMessage } from 'pages/Bookings/NoBookingsForPreFiltersMessage/NoBookingsForPreFiltersMessage'
import {
  formatAndOrderAddresses,
  formatAndOrderVenues,
} from 'repository/venuesService'
import { Spinner } from 'ui-kit/Spinner/Spinner'
import { Tabs } from 'ui-kit/Tabs/Tabs'

import { stringify } from '../../commons/utils/query-string'

import styles from './Bookings.module.scss'
import { BookingsRecapTable } from './BookingsRecapTable/BookingsRecapTable'
import { PreFilters } from './PreFilters/PreFilters'

type BookingsProps<T> = {
  locationState?: { statuses: string[] }
  audience: Audience
  getFilteredBookingsAdapter: (
    params: PreFiltersParams & { page?: number }
  ) => Promise<{
    bookings: T[]
    pages: number
    currentPage: number
  }>
  getUserHasBookingsAdapter: () => Promise<boolean>
}

const MAX_LOADED_PAGES = 5

export const BookingsScreen = <
  T extends BookingRecapResponseModel | CollectiveBookingResponseModel,
>({
  locationState,
  audience,
  getFilteredBookingsAdapter,
  getUserHasBookingsAdapter,
}: BookingsProps<T>): JSX.Element => {
  const { currentUser: user } = useCurrentUser()
  const notify = useNotification()
  const { logEvent } = useAnalytics()

  const isNewInterfaceActive = useIsNewInterfaceActive()
  const selectedOffererId = useSelector(selectCurrentOffererId)

  const initialAppliedFilters = {
    ...DEFAULT_PRE_FILTERS,
    ...{
      offerId: isNewInterfaceActive ? selectedOffererId?.toString() : undefined,
    },
  }
  const [appliedPreFilters, setAppliedPreFilters] = useState<PreFiltersParams>(
    initialAppliedFilters
  )
  const [wereBookingsRequested, setWereBookingsRequested] = useState(false)
  const [urlParams, setUrlParams] = useState<PreFiltersParams>(
    initialAppliedFilters
  )

  // FIXME: Needed because `isNewInterfaceActive` can change, and the initial state won't.
  useEffect(() => {
    const initialFilters = {
      ...DEFAULT_PRE_FILTERS,
      ...{
        offerId: isNewInterfaceActive
          ? selectedOffererId?.toString()
          : undefined,
      },
    }
    setAppliedPreFilters(initialFilters)
  }, [isNewInterfaceActive])

  const venuesQuery = useSWR(
    [
      GET_VENUES_QUERY_KEY,
      isNewInterfaceActive ? selectedOffererId : undefined,
    ],
    ([, maybeOffererId]) => api.getVenues(undefined, false, maybeOffererId)
  )

  const venues = formatAndOrderVenues(venuesQuery.data?.venues ?? []).map(
    (venue) => ({
      id: String(venue.value),
      displayName: venue.label,
    })
  )

  const offererAddressQuery = useSWR(
    [
      GET_OFFERER_ADDRESS_QUERY_KEY,
      isNewInterfaceActive ? selectedOffererId : undefined,
    ],
    ([, offererIdParam]) =>
      offererIdParam ? api.getOffererAddresses(offererIdParam, false) : [],
    { fallbackData: [] }
  )
  const offererAddresses = formatAndOrderAddresses(offererAddressQuery.data)

  const bookingsQuery = useSWR(
    !isEqual(appliedPreFilters, initialAppliedFilters)
      ? [GET_BOOKINGS_QUERY_KEY, appliedPreFilters]
      : null,
    async ([, filterParams]) => {
      setWereBookingsRequested(true)
      const { bookings, pages, currentPage } = await getFilteredBookingsAdapter(
        { ...filterParams }
      )

      if (currentPage === MAX_LOADED_PAGES && currentPage < pages) {
        notify.information(
          'L’affichage des réservations a été limité à 5 000 réservations. Vous pouvez modifier les filtres pour affiner votre recherche.'
        )
      }

      return bookings
    },
    { fallbackData: [] }
  )

  const hasBookingsQuery = useSWR(
    user.isAdmin ? null : [GET_HAS_BOOKINGS_QUERY_KEY],
    () => getUserHasBookingsAdapter(),
    { fallbackData: true }
  )

  const resetPreFilters = () => {
    setWereBookingsRequested(false)
    setAppliedPreFilters(initialAppliedFilters)
    logEvent(Events.CLICKED_RESET_FILTERS, {
      from: location.pathname,
    })
  }

  const resetAndApplyPreFilters = () => {
    resetPreFilters()
    updateUrl({ ...initialAppliedFilters })
  }

  const applyPreFilters = (filters: PreFiltersParams) => {
    setAppliedPreFilters(filters)
  }

  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(location.search)

    if (
      params.has('offerVenueId') ||
      params.has('bookingStatusFilter') ||
      params.has('bookingBeginningDate') ||
      params.has('bookingEndingDate') ||
      params.has('offerType') ||
      params.has('offerEventDate')
    ) {
      const filterToLoad: PreFiltersParams = {
        offerVenueId:
          params.get('offerVenueId') ?? DEFAULT_PRE_FILTERS.offerVenueId,
        offererAddressId:
          params.get('offererAddressId') ??
          DEFAULT_PRE_FILTERS.offererAddressId,
        // TODO typeguard this to remove the `as`
        bookingStatusFilter:
          (params.get('bookingStatusFilter') as BookingStatusFilter | null) ??
          initialAppliedFilters.bookingStatusFilter,
        bookingBeginningDate:
          params.get('bookingBeginningDate') ??
          (params.has('offerEventDate')
            ? ''
            : initialAppliedFilters.bookingBeginningDate),
        bookingEndingDate:
          params.get('bookingEndingDate') ??
          (params.has('offerEventDate')
            ? ''
            : initialAppliedFilters.bookingEndingDate),
        offerEventDate:
          params.get('offerEventDate') ?? initialAppliedFilters.offerEventDate,
      }

      setAppliedPreFilters(filterToLoad)
    }
  }, [location])

  const updateUrl = (filter: PreFiltersParams) => {
    const partialUrlInfo = {
      bookingStatusFilter: filter.bookingStatusFilter,
      ...(filter.offerEventDate && filter.offerEventDate !== 'all'
        ? { offerEventDate: filter.offerEventDate }
        : {}),
      ...(filter.bookingBeginningDate
        ? {
            bookingBeginningDate: filter.bookingBeginningDate,
          }
        : {}),
      ...(filter.bookingEndingDate
        ? { bookingEndingDate: filter.bookingEndingDate }
        : {}),
      ...(filter.offerVenueId ? { offerVenueId: filter.offerVenueId } : {}),
      ...(filter.offererAddressId
        ? { offererAddressId: filter.offererAddressId }
        : {}),
    } as Partial<PreFiltersParams>

    setUrlParams({
      ...urlParams,
      ...partialUrlInfo,
    })
    navigate(
      `/reservations${
        audience === Audience.COLLECTIVE ? '/collectives' : ''
      }?page=1&${stringify(partialUrlInfo)}`
    )
  }

  const title = isNewInterfaceActive
    ? audience === Audience.COLLECTIVE
      ? 'Réservations collectives'
      : 'Réservations individuelles'
    : 'Réservations'

  return (
    <div className="bookings-page">
      <h1 className={styles['title']}>{title}</h1>
      {!isNewInterfaceActive && (
        <Tabs
          nav="Réservations individuelles et collectives"
          selectedKey={audience}
          tabs={[
            {
              label: 'Réservations individuelles',
              url: '/reservations',
              key: 'individual',
              icon: strokeUserIcon,
            },
            {
              label: 'Réservations collectives',
              url: '/reservations/collectives',
              key: 'collective',
              icon: strokeLibraryIcon,
            },
          ]}
        />
      )}

      <PreFilters
        appliedPreFilters={appliedPreFilters}
        applyPreFilters={applyPreFilters}
        audience={audience}
        hasResult={bookingsQuery.data.length > 0}
        isFiltersDisabled={!hasBookingsQuery.data}
        isLocalLoading={venuesQuery.isLoading}
        isTableLoading={bookingsQuery.isLoading}
        resetPreFilters={resetPreFilters}
        venues={venues}
        offererAddresses={offererAddresses}
        urlParams={urlParams}
        updateUrl={updateUrl}
        wereBookingsRequested={wereBookingsRequested}
      />

      {wereBookingsRequested ? (
        bookingsQuery.data.length > 0 ? (
          <BookingsRecapTable
            bookingsRecap={bookingsQuery.data}
            isLoading={bookingsQuery.isLoading}
            locationState={locationState}
            audience={audience}
            resetBookings={resetAndApplyPreFilters}
          />
        ) : bookingsQuery.isLoading ? (
          <Spinner />
        ) : (
          <NoBookingsForPreFiltersMessage resetPreFilters={resetPreFilters} />
        )
      ) : hasBookingsQuery.data ? (
        <ChoosePreFiltersMessage />
      ) : (
        <NoData page="bookings" />
      )}
    </div>
  )
}
