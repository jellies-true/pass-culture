import { useFormikContext } from 'formik'
import useSWR from 'swr'

import { api } from 'apiClient/api'
import { Callout } from 'components/Callout/Callout'
import { CalloutVariant } from 'components/Callout/types'
import { FormLayout } from 'components/FormLayout/FormLayout'
import { OnImageUploadArgs } from 'components/ImageUploader/ButtonImageEdit/ModalImageEdit/ModalImageEdit'
import { ImageUploaderOffer } from 'components/IndividualOfferForm/ImageUploaderOffer/ImageUploaderOffer'
import { GET_MUSIC_TYPES_QUERY_KEY } from 'config/swrQueryKeys'
import { showOptionsTree } from 'core/Offers/categoriesSubTypes'
import { IndividualOfferImage } from 'core/Offers/types'
import { useActiveFeature } from 'hooks/useActiveFeature'
import { Select } from 'ui-kit/form/Select/Select'
import { TextInput } from 'ui-kit/form/TextInput/TextInput'
import { TimePicker } from 'ui-kit/form/TimePicker/TimePicker'

import { DEFAULT_DETAILS_FORM_VALUES } from '../constants'
import { DetailsFormValues } from '../types'
import { buildShowSubTypeOptions, hasMusicType } from '../utils'

import styles from './DetailsSubForm.module.scss'

export const ARTISTIC_INFORMATION_FIELDS = [
  'speaker',
  'author',
  'visa',
  'stageDirector',
  'performer',
  'ean',
  'durationMinutes',
  'showType',
  'gtl_id',
]

export type DetailsSubFormProps = {
  isProductBased: boolean
  isOfferCDOrVinyl: boolean
  readOnlyFields: string[]
  onImageUpload: (values: OnImageUploadArgs) => Promise<void>
  onImageDelete: () => Promise<void>
  imageOffer?: IndividualOfferImage
}

export const DetailsSubForm = ({
  isProductBased,
  isOfferCDOrVinyl,
  readOnlyFields,
  onImageUpload,
  onImageDelete,
  imageOffer,
}: DetailsSubFormProps) => {
  const {
    values: { categoryId, showType, subcategoryConditionalFields },
  } = useFormikContext<DetailsFormValues>()
  const isSearchByEanEnabled = useActiveFeature('WIP_EAN_CREATION')

  const musicTypesQuery = useSWR(
    GET_MUSIC_TYPES_QUERY_KEY,
    () => api.getMusicTypes(),
    { fallbackData: [] }
  )
  const musicTypesOptions = musicTypesQuery.data.map((data) => ({
    value: data.gtl_id,
    label: data.label,
  }))

  const showTypesOptions = showOptionsTree
    .map((data) => ({
      label: data.label,
      value: data.code.toString(),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'fr'))

  const showSubTypeOptions = buildShowSubTypeOptions(showType)

  // In the context of an offer creation, vinyls & CDs must be
  // product-based offers so the form must be pre-filled with
  // the results of an EAN search.
  const displayRedirectionCallout =
    isSearchByEanEnabled && !isProductBased && isOfferCDOrVinyl
  const displayImageUploader = !isProductBased || imageOffer
  const displayArtisticInformations = ARTISTIC_INFORMATION_FIELDS.some(
    (field) => subcategoryConditionalFields.includes(field)
  )

  return (
    <>
      <div role="alert">
        {displayRedirectionCallout && (
          <Callout
            className={styles.callout}
            links={[
              {
                href: '#ean',
                label: 'Scanner ou rechercher un produit par EAN',
                isSectionLink: true,
              },
            ]}
            variant={CalloutVariant.ERROR}
          >
            Cette catégorie nécessite un EAN.
          </Callout>
        )}
      </div>
      {!displayRedirectionCallout && (
        <>
          {displayImageUploader && (
            <ImageUploaderOffer
              onImageUpload={onImageUpload}
              onImageDelete={onImageDelete}
              imageOffer={imageOffer}
              hideActionButtons={isProductBased}
            />
          )}
          {displayArtisticInformations && (
            <FormLayout.Section title="Informations artistiques">
              {hasMusicType(categoryId, subcategoryConditionalFields) && (
                <FormLayout.Row>
                  <Select
                    label="Genre musical"
                    name="gtl_id"
                    options={musicTypesOptions}
                    defaultOption={{
                      label: 'Choisir un genre musical',
                      value: DEFAULT_DETAILS_FORM_VALUES.gtl_id,
                    }}
                    disabled={readOnlyFields.includes('gtl_id')}
                  />
                </FormLayout.Row>
              )}
              {subcategoryConditionalFields.includes('showType') && (
                <>
                  <FormLayout.Row>
                    <Select
                      label="Type de spectacle"
                      name="showType"
                      options={showTypesOptions}
                      defaultOption={{
                        label: 'Choisir un type de spectacle',
                        value: DEFAULT_DETAILS_FORM_VALUES.showType,
                      }}
                      disabled={readOnlyFields.includes('showType')}
                    />
                  </FormLayout.Row>
                  <FormLayout.Row>
                    <Select
                      label="Sous-type"
                      name="showSubType"
                      options={showSubTypeOptions}
                      defaultOption={{
                        label: 'Choisir un sous-type',
                        value: DEFAULT_DETAILS_FORM_VALUES.showSubType,
                      }}
                      disabled={readOnlyFields.includes('showSubType')}
                    />
                  </FormLayout.Row>
                </>
              )}
              {subcategoryConditionalFields.includes('speaker') && (
                <FormLayout.Row>
                  <TextInput
                    isOptional
                    label="Intervenant"
                    maxLength={1000}
                    name="speaker"
                    disabled={readOnlyFields.includes('speaker')}
                  />
                </FormLayout.Row>
              )}
              {subcategoryConditionalFields.includes('author') && (
                <FormLayout.Row>
                  <TextInput
                    isOptional
                    label="Auteur"
                    maxLength={1000}
                    name="author"
                    disabled={readOnlyFields.includes('author')}
                  />
                </FormLayout.Row>
              )}
              {subcategoryConditionalFields.includes('visa') && (
                <FormLayout.Row>
                  <TextInput
                    isOptional
                    label="Visa d’exploitation"
                    maxLength={1000}
                    name="visa"
                    disabled={readOnlyFields.includes('visa')}
                  />
                </FormLayout.Row>
              )}
              {subcategoryConditionalFields.includes('stageDirector') && (
                <FormLayout.Row>
                  <TextInput
                    isOptional
                    label="Metteur en scène"
                    maxLength={1000}
                    name="stageDirector"
                    disabled={readOnlyFields.includes('stageDirector')}
                  />
                </FormLayout.Row>
              )}
              {subcategoryConditionalFields.includes('performer') && (
                <FormLayout.Row>
                  <TextInput
                    isOptional
                    label="Interprète"
                    maxLength={1000}
                    name="performer"
                    disabled={readOnlyFields.includes('performer')}
                  />
                </FormLayout.Row>
              )}
              {subcategoryConditionalFields.includes('ean') &&
                !isProductBased && (
                  <FormLayout.Row>
                    <TextInput
                      isOptional
                      label="EAN-13 (European Article Numbering)"
                      countCharacters
                      name="ean"
                      maxLength={13}
                      disabled={readOnlyFields.includes('ean')}
                    />
                  </FormLayout.Row>
                )}
              {subcategoryConditionalFields.includes('durationMinutes') && (
                <FormLayout.Row>
                  <TimePicker
                    isOptional
                    label="Durée"
                    name="durationMinutes"
                    disabled={readOnlyFields.includes('durationMinutes')}
                    suggestedTimeList={{
                      min: '00:00',
                      max: '04:00',
                    }}
                  />
                </FormLayout.Row>
              )}
            </FormLayout.Section>
          )}
        </>
      )}
    </>
  )
}