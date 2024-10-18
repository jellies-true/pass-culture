import { useNavigate } from 'react-router-dom'

import { api } from 'apiClient/api'
import { serializeEducationalOfferer } from 'commons/core/OfferEducational/utils/serializeEducationalOfferer'
import { SENT_DATA_ERROR_MESSAGE } from 'commons/core/shared/constants'
import { useNotification } from 'commons/hooks/useNotification'

import { computeInitialValuesFromOffer } from './computeInitialValuesFromOffer'
import { createCollectiveOfferPayload } from './createOfferPayload'
import { postCollectiveOfferImage } from './postCollectiveOfferImage'

export const createOfferFromTemplate = async (
  navigate: ReturnType<typeof useNavigate>,
  notify: ReturnType<typeof useNotification>,
  templateOfferId: number,
  requestId?: string,
  isMarseilleActive?: boolean
) => {
  try {
    const offerTemplateResponse =
      await api.getCollectiveOfferTemplate(templateOfferId)

    const offererId = offerTemplateResponse.venue.managingOfferer.id
    const targetOffererId =
      offerTemplateResponse.venue.managingOfferer.id || offererId
    const { educationalOfferers } =
      await api.listEducationalOfferers(targetOffererId)
    const targetOfferer = educationalOfferers.find(
      (educationalOfferer) => educationalOfferer.id === targetOffererId
    )
    const offerers = targetOfferer
      ? serializeEducationalOfferer(targetOfferer)
      : null

    const initialValues = computeInitialValuesFromOffer(
      offerers,
      false,
      offerTemplateResponse,
      undefined,
      isMarseilleActive
    )
    const payload = createCollectiveOfferPayload(initialValues, templateOfferId)

    try {
      const response = await api.createCollectiveOffer(payload)
      await postCollectiveOfferImage({
        initialValues,
        notify,
        id: response.id,
      })

      navigate(
        `/offre/collectif/${response.id}/creation?structure=${offererId}${
          requestId ? `&requete=${requestId}` : ''
        }`
      )
    } catch {
      notify.error(SENT_DATA_ERROR_MESSAGE)
    }
  } catch {
    return notify.error(
      'Une erreur est survenue lors de la récupération de votre offre'
    )
  }
}