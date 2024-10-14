/* istanbul ignore file: DEBT, TO FIX */
import React from 'react'

import { useIndividualOfferContext } from 'commons/context/IndividualOfferContext/IndividualOfferContext'
import { OFFER_WIZARD_MODE } from 'commons/core/Offers/constants'
import { useOfferWizardMode } from 'commons/hooks/useOfferWizardMode'
import { IndivualOfferLayout } from 'components/IndividualOffer/IndivualOfferLayout/IndivualOfferLayout'
import { getTitle } from 'components/IndividualOffer/IndivualOfferLayout/utils/getTitle'
import { SummaryScreen } from 'components/IndividualOffer/SummaryScreen/SummaryScreen'
import { Spinner } from 'ui-kit/Spinner/Spinner'

const Summary = (): JSX.Element | null => {
  const { offer } = useIndividualOfferContext()

  const mode = useOfferWizardMode()

  let title: string | undefined = undefined
  if (
    mode === OFFER_WIZARD_MODE.READ_ONLY ||
    mode === OFFER_WIZARD_MODE.EDITION
  ) {
    title = 'Récapitulatif'
  } else {
    title = getTitle(mode)
  }
  if (offer === null) {
    return <Spinner />
  }

  return (
    <IndivualOfferLayout title={title} offer={offer} mode={mode}>
      <SummaryScreen />
    </IndivualOfferLayout>
  )
}

// Below exports are used by react-router-dom
// ts-unused-exports:disable-next-line
export const Component = Summary
