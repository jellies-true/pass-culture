import React, { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

import {
  CollectiveOfferResponseModel,
  GetOffererResponseModel,
  ListOffersOfferResponseModel,
  UserRole,
} from 'apiClient/v1'
import { NoData } from 'components/NoData/NoData'
import {
  DEFAULT_PAGE,
  DEFAULT_SEARCH_FILTERS,
  MAX_TOTAL_PAGES,
  NUMBER_OF_OFFERS_PER_PAGE,
  OFFER_STATUS_DRAFT,
} from 'core/Offers/constants'
import { SearchFiltersParams } from 'core/Offers/types'
import {
  computeOffersUrl,
  computeCollectiveOffersUrl,
} from 'core/Offers/utils/computeOffersUrl'
import { hasSearchFilters } from 'core/Offers/utils/hasSearchFilters'
import getUserValidatedOfferersNamesAdapter from 'core/shared/adapters/getUserValidatedOfferersNamesAdapter'
import { Audience } from 'core/shared/types'
import { SelectOption } from 'custom_types/form'
import useIsNewInterfaceActive from 'hooks/useIsNewInterfaceActive'
import fullPlusIcon from 'icons/full-plus.svg'
import strokeLibraryIcon from 'icons/stroke-library.svg'
import strokeUserIcon from 'icons/stroke-user.svg'
import { ActionsBar } from 'pages/Offers/Offers/ActionsBar/ActionsBar'
import OffersContainer from 'pages/Offers/Offers/Offers'
import { selectCurrentOffererId } from 'store/user/selectors'
import { ButtonLink } from 'ui-kit/Button/ButtonLink'
import { ButtonVariant } from 'ui-kit/Button/types'
import { Tabs } from 'ui-kit/Tabs/Tabs'
import Titles from 'ui-kit/Titles/Titles'

import { SearchFilters } from './SearchFilters/SearchFilters'

export interface OffersProps {
  currentPageNumber: number
  currentUser: {
    roles: Array<UserRole>
    isAdmin: boolean
  }
  isLoading: boolean
  offerer: GetOffererResponseModel | null
  offers: CollectiveOfferResponseModel[] | ListOffersOfferResponseModel[]
  initialSearchFilters: SearchFiltersParams
  audience: Audience
  redirectWithUrlFilters: (
    filters: SearchFiltersParams & {
      page?: number
      audience?: Audience
    }
  ) => void
  urlSearchFilters: SearchFiltersParams
  venues: SelectOption[]
  categories?: SelectOption[]
}

export const Offers = ({
  currentPageNumber,
  currentUser,
  isLoading,
  offerer,
  offers,
  initialSearchFilters,
  audience,
  redirectWithUrlFilters,
  urlSearchFilters,
  venues,
  categories,
}: OffersProps): JSX.Element => {
  const [searchFilters, setSearchFilters] =
    useState<SearchFiltersParams>(initialSearchFilters)

  const [areAllOffersSelected, setAreAllOffersSelected] = useState(false)
  const [selectedOfferIds, setSelectedOfferIds] = useState<string[]>([])
  const isNewSideBarNavigation = useIsNewInterfaceActive()
  const selectedOffererId = useSelector(selectCurrentOffererId)

  const { isAdmin } = currentUser
  const currentPageOffersSubset = offers.slice(
    (currentPageNumber - 1) * NUMBER_OF_OFFERS_PER_PAGE,
    currentPageNumber * NUMBER_OF_OFFERS_PER_PAGE
  )
  const hasOffers = currentPageOffersSubset.length > 0

  const userHasNoOffers =
    !isLoading && !hasOffers && !hasSearchFilters(urlSearchFilters)

  const [isOffererValidated, setIsOffererValidated] = useState<boolean>(false)
  const displayCreateOfferButton =
    !isNewSideBarNavigation && !isAdmin && isOffererValidated

  useEffect(() => {
    const loadValidatedUserOfferers = async () => {
      const validatedUserOfferers = await getUserValidatedOfferersNamesAdapter()
      const isCurrentOffererValidated = validatedUserOfferers.payload.some(
        (validatedOfferer) => validatedOfferer.id === selectedOffererId
      )
      if (isCurrentOffererValidated) {
        setIsOffererValidated(true)
      } else {
        setIsOffererValidated(false)
      }
    }
    // If user is admin, offer creation button doesn't show
    if (!isAdmin) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      loadValidatedUserOfferers()
    }
  }, [])

  const actionLink = displayCreateOfferButton ? (
    <ButtonLink
      variant={ButtonVariant.PRIMARY}
      link={{
        isExternal: false,
        to: `/offre/creation${selectedOffererId ? `?structure=${selectedOffererId}` : ''}`,
      }}
      icon={fullPlusIcon}
    >
      Créer une offre
    </ButtonLink>
  ) : undefined

  const nbSelectedOffers = areAllOffersSelected
    ? offers.length
    : selectedOfferIds.length

  const clearSelectedOfferIds = useCallback(() => {
    /* istanbul ignore next: DEBT, TO FIX */
    setSelectedOfferIds([])
  }, [])

  const toggleSelectAllCheckboxes = useCallback(() => {
    setAreAllOffersSelected((currentValue) => !currentValue)
  }, [])

  const resetFilters = () => {
    setSearchFilters(DEFAULT_SEARCH_FILTERS)
    applyUrlFiltersAndRedirect({
      ...DEFAULT_SEARCH_FILTERS,
    })
  }

  const numberOfPages = Math.ceil(offers.length / NUMBER_OF_OFFERS_PER_PAGE)
  const pageCount = Math.min(numberOfPages, MAX_TOTAL_PAGES)

  const applyUrlFiltersAndRedirect = (
    filters: SearchFiltersParams & { audience?: Audience }
  ) => {
    redirectWithUrlFilters(filters)
  }

  const applyFilters = () => {
    applyUrlFiltersAndRedirect({ ...searchFilters, page: DEFAULT_PAGE })
  }

  const removeOfferer = () => {
    const updatedFilters = {
      ...searchFilters,
      offererId: DEFAULT_SEARCH_FILTERS.offererId,
    }
    if (
      searchFilters.venueId === DEFAULT_SEARCH_FILTERS.venueId &&
      searchFilters.status !== DEFAULT_SEARCH_FILTERS.status
    ) {
      updatedFilters.status = DEFAULT_SEARCH_FILTERS.status
    }
    applyUrlFiltersAndRedirect(updatedFilters)
  }

  const getUpdateOffersStatusMessage = (tmpSelectedOfferIds: string[]) => {
    const selectedOffers = offers.filter((offer) =>
      tmpSelectedOfferIds.includes(offer.id.toString())
    )
    if (selectedOffers.some((offer) => offer.status === OFFER_STATUS_DRAFT)) {
      return 'Vous ne pouvez pas publier des brouillons depuis cette liste'
    }
    if (
      audience === Audience.COLLECTIVE &&
      selectedOffers.some((offer) => offer.hasBookingLimitDatetimesPassed)
    ) {
      return 'Vous ne pouvez pas publier des offres collectives dont la date de réservation est passée'
    }
    return ''
  }

  /* istanbul ignore next: DEBT, TO FIX */
  const canDeleteOffers = (tmpSelectedOfferIds: string[]) => {
    const selectedOffers = offers.filter((offer) =>
      tmpSelectedOfferIds.includes(offer.id.toString())
    )
    return !selectedOffers.some((offer) => offer.status !== OFFER_STATUS_DRAFT)
  }

  const isNewInterfaceActive = useIsNewInterfaceActive()
  const title = isNewInterfaceActive
    ? audience === Audience.COLLECTIVE
      ? 'Offres collectives'
      : 'Offres individuelles'
    : 'Offres'

  return (
    <div className="offers-page">
      <Titles action={actionLink} title={title} />
      {!isNewSideBarNavigation && (
        <Tabs
          nav="Offres individuelles et collectives"
          selectedKey={audience}
          tabs={[
            {
              label: 'Offres individuelles',
              url: computeOffersUrl({
                ...searchFilters,
                status: DEFAULT_SEARCH_FILTERS.status,
                page: currentPageNumber,
              }),
              key: 'individual',
              icon: strokeUserIcon,
            },
            {
              label: 'Offres collectives',
              url: computeCollectiveOffersUrl({
                ...searchFilters,
                status: DEFAULT_SEARCH_FILTERS.status,
                page: currentPageNumber,
              }),
              key: 'collective',
              icon: strokeLibraryIcon,
            },
          ]}
        />
      )}

      <SearchFilters
        applyFilters={applyFilters}
        audience={audience}
        categories={categories}
        disableAllFilters={userHasNoOffers}
        offerer={offerer}
        removeOfferer={removeOfferer}
        resetFilters={resetFilters}
        selectedFilters={searchFilters}
        setSearchFilters={setSearchFilters}
        venues={venues}
      />
      {userHasNoOffers ? (
        <NoData page="offers" />
      ) : (
        <OffersContainer
          applyFilters={applyFilters}
          applyUrlFiltersAndRedirect={applyUrlFiltersAndRedirect}
          areAllOffersSelected={areAllOffersSelected}
          audience={audience}
          currentPageNumber={currentPageNumber}
          currentPageOffersSubset={currentPageOffersSubset}
          currentUser={currentUser}
          hasOffers={hasOffers}
          isLoading={isLoading}
          offersCount={offers.length}
          pageCount={pageCount}
          resetFilters={resetFilters}
          searchFilters={searchFilters}
          selectedOfferIds={selectedOfferIds}
          setSearchFilters={setSearchFilters}
          setSelectedOfferIds={setSelectedOfferIds}
          toggleSelectAllCheckboxes={toggleSelectAllCheckboxes}
          urlSearchFilters={urlSearchFilters}
          isAtLeastOneOfferChecked={selectedOfferIds.length > 0}
        />
      )}
      {nbSelectedOffers > 0 && (
        <ActionsBar
          areAllOffersSelected={areAllOffersSelected}
          clearSelectedOfferIds={clearSelectedOfferIds}
          nbSelectedOffers={nbSelectedOffers}
          selectedOfferIds={selectedOfferIds}
          toggleSelectAllCheckboxes={toggleSelectAllCheckboxes}
          audience={audience}
          getUpdateOffersStatusMessage={getUpdateOffersStatusMessage}
          canDeleteOffers={canDeleteOffers}
        />
      )}
    </div>
  )
}
