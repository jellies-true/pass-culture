import React from 'react'
import { useNavigate } from 'react-router-dom'
import useSWR, { useSWRConfig } from 'swr'

import { GetCollectiveOfferResponseModel } from 'apiClient/v1'
import { Layout } from 'app/App/layout/Layout'
import {
  GET_COLLECTIVE_OFFER_QUERY_KEY,
  GET_EDUCATIONAL_INSTITUTIONS_QUERY_KEY,
} from 'commons/config/swrQueryKeys'
import {
  isCollectiveOfferTemplate,
  Mode,
} from 'commons/core/OfferEducational/types'
import { computeURLCollectiveOfferId } from 'commons/core/OfferEducational/utils/computeURLCollectiveOfferId'
import { extractInitialVisibilityValues } from 'commons/core/OfferEducational/utils/extractInitialVisibilityValues'
import { useNotification } from 'commons/hooks/useNotification'
import {
  MandatoryCollectiveOfferFromParamsProps,
  withCollectiveOfferFromParams,
} from 'pages/CollectiveOffer/CollectiveOffer/components/OfferEducational/useCollectiveOfferFromParams'
import { CollectiveOfferLayout } from 'pages/CollectiveOffer/CollectiveOfferLayout/CollectiveOfferLayout'
import { CollectiveOfferVisibilityScreen } from 'pages/CollectiveOfferVisibility/components/CollectiveOfferVisibility/CollectiveOfferVisibility'
import { Spinner } from 'ui-kit/Spinner/Spinner'

import { getEducationalInstitutions } from './getEducationalInstitutions'

const CollectiveOfferVisibility = ({
  offer,
  isTemplate,
}: MandatoryCollectiveOfferFromParamsProps) => {
  const notify = useNotification()
  const navigate = useNavigate()
  const { mutate } = useSWRConfig()

  const educationalInstitutionsQuery = useSWR(
    [GET_EDUCATIONAL_INSTITUTIONS_QUERY_KEY],
    () => getEducationalInstitutions(),
    { fallbackData: [] }
  )

  if (isCollectiveOfferTemplate(offer)) {
    throw new Error(
      'Impossible de mettre à jour la visibilité d’une offre vitrine.'
    )
  }

  const onSuccess = async ({
    message,
    payload,
  }: {
    message: string
    payload: GetCollectiveOfferResponseModel
  }) => {
    await mutate([GET_COLLECTIVE_OFFER_QUERY_KEY, offer.id])
    navigate(
      `/offre/${computeURLCollectiveOfferId(
        payload.id,
        false
      )}/collectif/recapitulatif`
    )
    notify.success(message)
  }

  if (educationalInstitutionsQuery.isLoading) {
    return <Spinner />
  }

  return (
    <Layout layout={'sticky-actions'}>
      <CollectiveOfferLayout subTitle={offer.name} isTemplate={isTemplate}>
        <CollectiveOfferVisibilityScreen
          mode={offer.isVisibilityEditable ? Mode.EDITION : Mode.READ_ONLY}
          initialValues={extractInitialVisibilityValues(
            offer.institution,
            offer.teacher
          )}
          onSuccess={onSuccess}
          institutions={educationalInstitutionsQuery.data}
          isLoadingInstitutions={educationalInstitutionsQuery.isLoading}
          offer={offer}
        />
      </CollectiveOfferLayout>
    </Layout>
  )
}

// Lazy-loaded by react-router-dom
// ts-unused-exports:disable-next-line
export const Component = withCollectiveOfferFromParams(
  CollectiveOfferVisibility
)
