import React, { useState } from 'react'
import { useLoaderData } from 'react-router-dom'

import { api } from 'apiClient/api'
import { GetOffererVenueResponseModel } from 'apiClient/v1'
import { ImageUploader, UploadImageValues } from 'components/ImageUploader'
import { OnImageUploadArgs } from 'components/ImageUploader/ButtonImageEdit/ModalImageEdit/ModalImageEdit'
import { UploaderModeEnum } from 'components/ImageUploader/types'
import {
  VenueBannerMetaProps,
  buildInitialValues,
} from 'components/VenueForm/ImageUploaderVenue/ImageUploaderVenue'
import { Events } from 'core/FirebaseEvents/constants'
import useAnalytics from 'hooks/useAnalytics'
import useNotification from 'hooks/useNotification'
import { postImageToVenue } from 'repository/pcapi/pcapi'
import { ButtonLink } from 'ui-kit'
import { ButtonVariant } from 'ui-kit/Button/types'

import { Card } from '../Card'
import { HomepageLoaderData } from '../Homepage'
import { VenueOfferSteps } from '../VenueOfferSteps/VenueOfferSteps'

import styles from './PartnerPage.module.scss'

export interface PartnerPageProps {
  offererId: string
  venue: GetOffererVenueResponseModel
}

export const PartnerPage = ({ offererId, venue }: PartnerPageProps) => {
  const { logEvent } = useAnalytics()
  const notify = useNotification()
  const { venueTypes } = useLoaderData() as HomepageLoaderData
  const venueType = venueTypes.find(
    (venueType) => venueType.id === venue.venueTypeCode
  )
  const initialValues = buildInitialValues(
    venue.bannerUrl,
    // There would be a lot of refactoring to remove this "as"
    // it would ask for a global typing refactor of the image uploads
    // on the backend & frontend to synchronise BannerMetaModel with VenueBannerMetaProps
    (venue.bannerMeta as VenueBannerMetaProps | null | undefined) || undefined
  )
  const [imageValues, setImageValues] =
    useState<UploadImageValues>(initialValues)

  const handleOnImageUpload = async ({
    imageFile,
    credit,
    cropParams,
  }: OnImageUploadArgs) => {
    try {
      const editedVenue = await postImageToVenue(
        venue.id,
        imageFile,
        credit,
        cropParams?.x,
        cropParams?.y,
        cropParams?.height,
        cropParams?.width
      )
      setImageValues(
        buildInitialValues(editedVenue.bannerUrl, editedVenue.bannerMeta)
      )

      notify.success('Vos modifications ont bien été prises en compte')
    } catch {
      notify.error(
        'Une erreur est survenue lors de la sauvegarde de vos modifications.\n Merci de réessayer plus tard'
      )
    }
  }

  const handleOnImageDelete = async () => {
    try {
      await api.deleteVenueBanner(venue.id)

      setImageValues(buildInitialValues())
    } catch {
      notify.error('Une erreur est survenue. Merci de réessayer plus tard.')
    }
  }

  const logButtonAddClick = () => {
    logEvent?.(Events.CLICKED_ADD_IMAGE, {
      venueId: venue.id,
      imageType: UploaderModeEnum.VENUE,
      isEdition: true,
    })
  }

  return (
    <Card>
      <div className={styles['header']}>
        <ImageUploader
          className={styles['image-uploader']}
          onImageUpload={handleOnImageUpload}
          onImageDelete={handleOnImageDelete}
          initialValues={imageValues}
          mode={UploaderModeEnum.VENUE}
          hideActionButtons
          onClickButtonImageAdd={logButtonAddClick}
        />

        <div>
          <div className={styles['venue-type']}>{venueType?.label}</div>
          <div className={styles['venue-name']}>{venue.name}</div>
          <address className={styles['venue-address']}>
            {venue.address}, {venue.postalCode} {venue.city}
          </address>

          <ButtonLink
            variant={ButtonVariant.SECONDARY}
            link={{
              to: `/structures/${offererId}/lieux/${venue.id}?modification`,
              isExternal: false,
              'aria-label': `Gérer la page de ${venue.name}`,
            }}
          >
            Gérer ma page
          </ButtonLink>
        </div>
      </div>

      <div className={styles['venue-offer-steps']}>
        <VenueOfferSteps venue={venue} hasVenue isInsidePartnerBlock />
      </div>
    </Card>
  )
}
