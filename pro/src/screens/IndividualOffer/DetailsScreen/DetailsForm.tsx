import { useFormikContext } from 'formik'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { useDebouncedCallback } from 'use-debounce'

import { api } from 'apiClient/api'
import {
  CategoryResponseModel,
  SubcategoryResponseModel,
  VenueListItemResponseModel,
  SubcategoryIdEnum,
} from 'apiClient/v1'
import { Callout } from 'components/Callout/Callout'
import { CalloutVariant } from 'components/Callout/types'
import { FormLayout } from 'components/FormLayout/FormLayout'
import { OnImageUploadArgs } from 'components/ImageUploader/ButtonImageEdit/ModalImageEdit/ModalImageEdit'
import { useIndividualOfferContext } from 'context/IndividualOfferContext/IndividualOfferContext'
import { CATEGORY_STATUS } from 'core/Offers/constants'
import { IndividualOfferImage } from 'core/Offers/types'
import { useActiveFeature } from 'hooks/useActiveFeature'
import { useSuggestedSubcategoriesAbTest } from 'hooks/useSuggestedSubcategoriesAbTest'
import fullMoreIcon from 'icons/full-more.svg'
import { selectCurrentOffererId } from 'store/user/selectors'
import { Select } from 'ui-kit/form/Select/Select'
import { TextArea } from 'ui-kit/form/TextArea/TextArea'
import { TextInput } from 'ui-kit/form/TextInput/TextInput'

import { DEFAULT_DETAILS_FORM_VALUES } from './constants'
import { DetailsSubForm } from './DetailsSubForm/DetailsSubForm'
import { Subcategories } from './Subcategories/Subcategories'
import { SuggestedSubcategories } from './SuggestedSubcategories/SuggestedSubcategories'
import { DetailsFormValues } from './types'
import { buildVenueOptions } from './utils'

const DEBOUNCE_TIME_BEFORE_REQUEST = 400

type DetailsFormProps = {
  filteredVenues: VenueListItemResponseModel[]
  filteredCategories: CategoryResponseModel[]
  filteredSubcategories: SubcategoryResponseModel[]
  readonlyFields: string[]
  onImageUpload: (values: OnImageUploadArgs) => Promise<void>
  onImageDelete: () => Promise<void>
  imageOffer?: IndividualOfferImage
}

export const DetailsForm = ({
  filteredVenues,
  filteredCategories,
  filteredSubcategories,
  readonlyFields: readOnlyFields,
  onImageUpload,
  onImageDelete,
  imageOffer,
}: DetailsFormProps): JSX.Element => {
  const areSuggestedSubcategoriesUsed = useSuggestedSubcategoriesAbTest()
  const [hasSuggestionsApiBeenCalled, setHasSuggestionsApiBeenCalled] =
    useState(false)
  const [suggestedSubcategories, setSuggestedSubcategories] = useState<
    string[]
  >([])
  const { values, setValues, handleChange } =
    useFormikContext<DetailsFormValues>()
  const {
    subcategoryId,
    description,
    venueId,
    name,
    suggestedSubcategory,
    productId,
  } = values
  const { offer, subCategories } = useIndividualOfferContext()

  const venueOptions = buildVenueOptions(
    filteredVenues,
    areSuggestedSubcategoriesUsed
  )

  const offerAddressEnabled = useActiveFeature('WIP_ENABLE_OFFER_ADDRESS')

  async function getSuggestedSubcategories() {
    if (!areSuggestedSubcategoriesUsed && !offer) {
      return
    }

    try {
      const response = await api.getSuggestedSubcategories(
        name,
        description,
        Number(venueId)
      )

      if (response.subcategoryIds.length === 0) {
        throw new Error('No suggested subcategories')
      }

      setSuggestedSubcategories(response.subcategoryIds)
    } catch (err) {
      if (!suggestedSubcategory) {
        await setValues({
          ...values,
          suggestedSubcategory: 'OTHER',
        })
      }
    }

    if (!hasSuggestionsApiBeenCalled) {
      setHasSuggestionsApiBeenCalled(true)
    }
  }

  const debouncedOnChangeGetSuggestedSubcategories = useDebouncedCallback(
    getSuggestedSubcategories,
    DEBOUNCE_TIME_BEFORE_REQUEST
  )

  async function onChangeGetSuggestedSubcategories(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    handleChange(e)
    if (areSuggestedSubcategoriesUsed) {
      await debouncedOnChangeGetSuggestedSubcategories()
    }
  }
  const subcategory = subCategories.find((s) => s.id === subcategoryId)

  const isSubCategorySelected =
    subcategoryId !== DEFAULT_DETAILS_FORM_VALUES.subcategoryId
  const isSubCategoryCDOrVinyl =
    subcategoryId === SubcategoryIdEnum.SUPPORT_PHYSIQUE_MUSIQUE_CD ||
    subcategoryId === SubcategoryIdEnum.SUPPORT_PHYSIQUE_MUSIQUE_VINYLE

  const SHOW_VENUE_SELECTION_FIELD =
    !areSuggestedSubcategoriesUsed || venueOptions.length > 1

  const selectedOffererId = useSelector(selectCurrentOffererId)

  const showAddVenueBanner =
    !areSuggestedSubcategoriesUsed && venueOptions.length === 0
  const isProductBased = !!productId

  const isSuggestedSubcategoryDisplayed =
    areSuggestedSubcategoriesUsed && !offer && !isProductBased

  const showOtherAddVenueBanner =
    areSuggestedSubcategoriesUsed &&
    venueOptions.length === 0 &&
    subcategory?.onlineOfflinePlatform === CATEGORY_STATUS.OFFLINE

  return (
    <>
      <FormLayout.Section title="À propos de votre offre">
        {showAddVenueBanner && (
          <FormLayout.Row>
            <Callout
              links={[
                {
                  href: `/structures/${selectedOffererId}/lieux/creation`,
                  icon: {
                    src: fullMoreIcon,
                    alt: '',
                  },
                  label: 'Ajouter un lieu',
                },
              ]}
              variant={CalloutVariant.ERROR}
            >
              Pour créer une offre dans cette catégorie, ajoutez d’abord un lieu
              à votre structure.
            </Callout>
          </FormLayout.Row>
        )}
        {!showAddVenueBanner && (
          <>
            {SHOW_VENUE_SELECTION_FIELD && (
              <FormLayout.Row>
                <Select
                  label={offerAddressEnabled ? 'Qui propose l’offre ?' : 'Lieu'}
                  name="venueId"
                  options={venueOptions}
                  onChange={async (ev) => {
                    if (isProductBased) {
                      return
                    }

                    await onChangeGetSuggestedSubcategories(ev)
                  }}
                  disabled={
                    readOnlyFields.includes('venueId') ||
                    venueOptions.length === 1
                  }
                  {...(isSuggestedSubcategoryDisplayed && {
                    'aria-controls': 'suggested-subcategories',
                  })}
                />
              </FormLayout.Row>
            )}
            <FormLayout.Row>
              <TextInput
                countCharacters
                label="Titre de l’offre"
                maxLength={90}
                name="name"
                onChange={onChangeGetSuggestedSubcategories}
                disabled={readOnlyFields.includes('name')}
                {...(isSuggestedSubcategoryDisplayed && {
                  'aria-controls': 'suggested-subcategories',
                })}
              />
            </FormLayout.Row>
            <FormLayout.Row>
              <TextArea
                isOptional
                label="Description"
                maxLength={1000}
                name="description"
                onChange={onChangeGetSuggestedSubcategories}
                disabled={readOnlyFields.includes('description')}
                {...(isSuggestedSubcategoryDisplayed && {
                  'aria-controls': 'suggested-subcategories',
                })}
              />
            </FormLayout.Row>
          </>
        )}
      </FormLayout.Section>
      {isSuggestedSubcategoryDisplayed ? (
        <SuggestedSubcategories
          hasApiBeenCalled={hasSuggestionsApiBeenCalled}
          suggestedSubcategories={suggestedSubcategories}
          readOnlyFields={readOnlyFields}
          filteredCategories={filteredCategories}
          filteredSubcategories={filteredSubcategories}
        />
      ) : (
        !showAddVenueBanner && (
          <Subcategories
            readOnlyFields={readOnlyFields}
            filteredCategories={filteredCategories}
            filteredSubcategories={filteredSubcategories}
          />
        )
      )}
      {isSubCategorySelected && (
        <>
          {showOtherAddVenueBanner ? (
            <FormLayout.Row>
              <Callout
                links={[
                  {
                    href: `/structures/${selectedOffererId}/lieux/creation`,
                    icon: {
                      src: fullMoreIcon,
                      alt: '',
                    },
                    label: 'Ajouter un lieu',
                  },
                ]}
                variant={CalloutVariant.ERROR}
              >
                Pour créer une offre dans cette catégorie, ajoutez d’abord un
                lieu à votre structure.
              </Callout>
            </FormLayout.Row>
          ) : (
            <DetailsSubForm
              isOfferProductBased={isProductBased}
              isOfferCDOrVinyl={isSubCategoryCDOrVinyl}
              readOnlyFields={readOnlyFields}
              onImageUpload={onImageUpload}
              onImageDelete={onImageDelete}
              imageOffer={imageOffer}
            />
          )}
        </>
      )}
    </>
  )
}
