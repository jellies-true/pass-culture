import {
  DMSApplicationstatus,
  GetOffererResponseModel,
  GetOffererVenueResponseModel,
} from 'apiClient/v1'
import { getLastCollectiveDmsApplication } from 'commons/utils/getLastCollectiveDmsApplication'

export const getVirtualVenueFromOfferer = (
  offerer?: GetOffererResponseModel | null
): GetOffererVenueResponseModel | null => {
  if (!offerer?.hasDigitalVenueAtLeastOneOffer) {
    return null
  }

  return offerer.managedVenues?.find((venue) => venue.isVirtual) ?? null
}

export const getPhysicalVenuesFromOfferer = (
  offerer?: GetOffererResponseModel | null
): GetOffererVenueResponseModel[] =>
  offerer?.managedVenues?.filter((venue) => !venue.isVirtual) ?? []

export const hasOffererAtLeastOnePhysicalVenue = (
  offerer?: GetOffererResponseModel | null
): boolean =>
  offerer?.managedVenues?.some((venue) => !venue.isVirtual && venue.id) ?? false

export const shouldDisplayEACInformationSectionForVenue = (
  venue?: GetOffererVenueResponseModel
): boolean => {
  const dmsInformations = getLastCollectiveDmsApplication(
    venue?.collectiveDmsApplications ?? []
  )

  return (
    Boolean(dmsInformations) &&
    (dmsInformations?.state === DMSApplicationstatus.EN_INSTRUCTION ||
      dmsInformations?.state === DMSApplicationstatus.EN_CONSTRUCTION)
  )
}

export const shouldShowVenueOfferStepsForVenue = (
  venue?: GetOffererVenueResponseModel
) =>
  shouldDisplayEACInformationSectionForVenue(venue) || !venue?.hasCreatedOffer
