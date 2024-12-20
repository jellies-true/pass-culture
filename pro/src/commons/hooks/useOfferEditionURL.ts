import { CollectiveOfferStatus } from 'apiClient/v1'
import { computeURLCollectiveOfferId } from 'commons/core/OfferEducational/utils/computeURLCollectiveOfferId'
import {
  OFFER_STATUS_DRAFT,
  OFFER_WIZARD_MODE,
} from 'commons/core/Offers/constants'
import { getIndividualOfferUrl } from 'commons/core/Offers/utils/getIndividualOfferUrl'
import { OFFER_WIZARD_STEP_IDS } from 'components/IndividualOfferNavigation/constants'

type UseOfferEditionURL = {
  isOfferEducational: boolean
  offerId: number
  isShowcase?: boolean
  status?: string
}

export const useOfferEditionURL = ({
  isOfferEducational,
  offerId,
  isShowcase,
  status,
}: UseOfferEditionURL): string => {
  if (isOfferEducational) {
    const id = computeURLCollectiveOfferId(offerId, Boolean(isShowcase))
    if (status && status === CollectiveOfferStatus.DRAFT) {
      return `/offre/collectif/${id}/creation`
    }
    return `/offre/${id}/collectif/recapitulatif`
  }
  if (status && status === OFFER_STATUS_DRAFT) {
    return getIndividualOfferUrl({
      offerId,
      mode: OFFER_WIZARD_MODE.CREATION,
      step: OFFER_WIZARD_STEP_IDS.DETAILS,
    })
  }

  return getIndividualOfferUrl({
    offerId,
    mode: OFFER_WIZARD_MODE.READ_ONLY,
    step: OFFER_WIZARD_STEP_IDS.DETAILS,
  })
}

export const useOfferStockEditionURL = (
  isOfferEducational: boolean,
  offerId: number,
  isShowcase?: boolean
): string => {
  if (isOfferEducational) {
    const id = computeURLCollectiveOfferId(offerId, Boolean(isShowcase))
    return `/offre/${id}/collectif/stocks/edition`
  }

  return getIndividualOfferUrl({
    offerId,
    mode: OFFER_WIZARD_MODE.EDITION,
    step: OFFER_WIZARD_STEP_IDS.STOCKS,
  })
}
