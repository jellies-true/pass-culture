import React, { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import {
  BookingRecapResponseModel,
  BookingStatusFilter,
  CollectiveBookingResponseModel,
} from 'apiClient/v1'
import NoData from 'components/NoData'
import { DEFAULT_PRE_FILTERS } from 'core/Bookings/constants'
import { GetVenuesAdapter, PreFiltersParams } from 'core/Bookings/types'
import { Events } from 'core/FirebaseEvents/constants'
import { GET_DATA_ERROR_MESSAGE } from 'core/shared/constants'
import { Audience } from 'core/shared/types'
import { SelectOption } from 'custom_types/form'
import useAnalytics from 'hooks/useAnalytics'
import useCurrentUser from 'hooks/useCurrentUser'
import useIsNewInterfaceActive from 'hooks/useIsNewInterfaceActive'
import useNotification from 'hooks/useNotification'
import strokeLibraryIcon from 'icons/stroke-library.svg'
import strokeUserIcon from 'icons/stroke-user.svg'
import ChoosePreFiltersMessage from 'pages/Bookings/ChoosePreFiltersMessage/ChoosePreFiltersMessage'
import NoBookingsForPreFiltersMessage from 'pages/Bookings/NoBookingsForPreFiltersMessage/NoBookingsForPreFiltersMessage'
import Spinner from 'ui-kit/Spinner/Spinner'
import { Tabs } from 'ui-kit/Tabs/Tabs'
import Titles from 'ui-kit/Titles/Titles'

import { stringify } from '../../utils/query-string'

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
  getVenuesAdapter: GetVenuesAdapter
}

const MAX_LOADED_PAGES = 5

export const BookingsScreen = <
  T extends BookingRecapResponseModel | CollectiveBookingResponseModel,
>({
  locationState,
  audience,
  getFilteredBookingsAdapter,
  getUserHasBookingsAdapter,
  getVenuesAdapter,
}: BookingsProps<T>): JSX.Element => {
  const { currentUser: user } = useCurrentUser()
  const notify = useNotification()
  const { logEvent } = useAnalytics()

  const [appliedPreFilters, setAppliedPreFilters] = useState<PreFiltersParams>({
    ...DEFAULT_PRE_FILTERS,
  })
  const [isTableLoading, setIsTableLoading] = useState(false)
  const [bookings, setBookings] = useState<T[]>([])
  const [wereBookingsRequested, setWereBookingsRequested] = useState(false)
  const [hasBooking, setHasBooking] = useState(true)
  const [isLocalLoading, setIsLocalLoading] = useState(false)
  const [venues, setVenues] = useState<SelectOption[]>([])
  const [urlParams, setUrlParams] =
    useState<PreFiltersParams>(DEFAULT_PRE_FILTERS)

  const isNewSideNavActive = useIsNewInterfaceActive()

  const resetPreFilters = useCallback(() => {
    setWereBookingsRequested(false)
    setAppliedPreFilters({ ...DEFAULT_PRE_FILTERS })
    logEvent?.(Events.CLICKED_RESET_FILTERS, {
      from: location.pathname,
    })
  }, [setWereBookingsRequested])

  const resetAndApplyPreFilters = useCallback(() => {
    resetPreFilters()
    updateUrl({ ...DEFAULT_PRE_FILTERS })
  }, [resetPreFilters])

  const applyPreFilters = async (filters: PreFiltersParams) => {
    setAppliedPreFilters(filters)
    await loadBookingsRecap(filters)
  }

  const loadBookingsRecap = async (preFilters: PreFiltersParams) => {
    setIsTableLoading(true)
    setBookings([])
    setWereBookingsRequested(true)

    try {
      const { bookings, currentPage, pages } = await getFilteredBookingsAdapter(
        {
          ...preFilters,
        }
      )
      setBookings(bookings)

      setIsTableLoading(false)
      if (currentPage === MAX_LOADED_PAGES && currentPage < pages) {
        notify.information(
          'L’affichage des réservations a été limité à 5 000 réservations. Vous pouvez modifier les filtres pour affiner votre recherche.'
        )
      }
    } catch {
      notify.error(GET_DATA_ERROR_MESSAGE)
    }
  }

  const reloadBookings = async () => {
    await loadBookingsRecap(appliedPreFilters)
  }

  useEffect(() => {
    const loadHasBookings = async () => {
      if (!user.isAdmin) {
        const hasBookings = await getUserHasBookingsAdapter()
        setHasBooking(hasBookings)
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    loadHasBookings()
  }, [user.isAdmin, setHasBooking, getUserHasBookingsAdapter])

  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const applyFilters = async () => {
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
          // TODO typeguard this to remove the `as`
          bookingStatusFilter:
            (params.get('bookingStatusFilter') as BookingStatusFilter | null) ??
            DEFAULT_PRE_FILTERS.bookingStatusFilter,
          bookingBeginningDate:
            params.get('bookingBeginningDate') ??
            (params.has('offerEventDate')
              ? ''
              : DEFAULT_PRE_FILTERS.bookingBeginningDate),
          bookingEndingDate:
            params.get('bookingEndingDate') ??
            (params.has('offerEventDate')
              ? ''
              : DEFAULT_PRE_FILTERS.bookingEndingDate),
          offerType: params.get('offerType') ?? DEFAULT_PRE_FILTERS.offerType,
          offerEventDate:
            params.get('offerEventDate') ?? DEFAULT_PRE_FILTERS.offerEventDate,
        }

        await loadBookingsRecap(filterToLoad)
        setAppliedPreFilters(filterToLoad)
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    applyFilters()
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
      ...(filter.offerType ? { offerType: filter.offerType } : {}),
      ...(filter.offerVenueId ? { offerVenueId: filter.offerVenueId } : {}),
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
  useEffect(() => {
    async function fetchVenues() {
      setIsLocalLoading(true)
      const { isOk, message, payload } = await getVenuesAdapter()

      if (!isOk) {
        notify.error(message)
      }
      setVenues(payload.venues)
      setIsLocalLoading(false)
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchVenues()
  }, [setIsLocalLoading, setVenues, notify, getVenuesAdapter])

  const isNewInterfaceActive = useIsNewInterfaceActive()
  const title = isNewInterfaceActive
    ? audience === Audience.COLLECTIVE
      ? 'Réservations collectives'
      : 'Réservations individuelles'
    : 'Réservations'

  return (
    <div className="bookings-page">
      <Titles title={title} />
      {!isNewSideNavActive && (
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
        hasResult={bookings.length > 0}
        isFiltersDisabled={!hasBooking}
        isLocalLoading={isLocalLoading}
        isTableLoading={isTableLoading}
        resetPreFilters={resetPreFilters}
        venues={venues.map((venue) => ({
          id: String(venue.value),
          displayName: venue.label,
        }))}
        urlParams={urlParams}
        updateUrl={updateUrl}
        wereBookingsRequested={wereBookingsRequested}
      />

      {wereBookingsRequested ? (
        bookings.length > 0 ? (
          <BookingsRecapTable
            bookingsRecap={bookings}
            isLoading={isTableLoading}
            locationState={locationState}
            audience={audience}
            reloadBookings={reloadBookings}
            resetBookings={resetAndApplyPreFilters}
          />
        ) : isTableLoading ? (
          <Spinner />
        ) : (
          <NoBookingsForPreFiltersMessage resetPreFilters={resetPreFilters} />
        )
      ) : hasBooking ? (
        <ChoosePreFiltersMessage />
      ) : (
        <NoData audience={audience} page="bookings" />
      )}
    </div>
  )
}
