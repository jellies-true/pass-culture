import React from 'react'

import useOfferEditionURL from 'components/hooks/useFeatureFlaggedOfferEditionURL'
import useFeatureFlagedOfferStockEditionURL from 'components/hooks/useFeatureFlaggedOfferStockEditionURL'
import Breadcrumb, {
  BreadcrumbStyle,
} from 'new_components/Breadcrumb/Breadcrumb'

export enum OfferBreadcrumbStep {
  DETAILS = 'details',
  STOCKS = 'stocks',
  CONFIRMATION = 'confirmation',
}

interface IOfferBreadcrumb {
  activeStep: OfferBreadcrumbStep
  isCreatingOffer: boolean
  offerId?: string
  isOfferEducational?: boolean
  className?: string
}

const OfferBreadcrumb = ({
  activeStep,
  isCreatingOffer,
  offerId = '',
  isOfferEducational = false,
  className,
}: IOfferBreadcrumb): JSX.Element => {
  const offerEditionUrl = useOfferEditionURL(isOfferEducational, offerId)
  const stockEditionUrl = useFeatureFlagedOfferStockEditionURL(
    isOfferEducational,
    offerId
  )

  let steps = []

  if (!isCreatingOffer) {
    steps = [
      {
        id: OfferBreadcrumbStep.DETAILS,
        label: "Détails de l'offre",
        url: offerEditionUrl,
      },
      {
        id: OfferBreadcrumbStep.STOCKS,
        label: isOfferEducational ? 'Date et prix' : 'Stock et prix',
        url: stockEditionUrl,
      },
    ]
  } else {
    steps = [
      {
        id: OfferBreadcrumbStep.DETAILS,
        label: "Détails de l'offre",
      },
      {
        id: OfferBreadcrumbStep.STOCKS,
        label: isOfferEducational ? 'Date et prix' : 'Stock et prix',
      },
      {
        id: OfferBreadcrumbStep.CONFIRMATION,
        label: 'Confirmation',
      },
    ]
  }

  return (
    <Breadcrumb
      activeStep={activeStep}
      className={className}
      steps={steps}
      styleType={
        isCreatingOffer ? BreadcrumbStyle.DEFAULT : BreadcrumbStyle.TAB
      }
    />
  )
}

export default OfferBreadcrumb
