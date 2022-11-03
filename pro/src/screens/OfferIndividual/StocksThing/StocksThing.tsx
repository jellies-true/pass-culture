import { FormikProvider, useFormik } from 'formik'
import React, { useState } from 'react'

import FormLayout from 'components/FormLayout'
import { OFFER_WIZARD_STEP_IDS } from 'components/OfferIndividualStepper'
import { StockFormRow } from 'components/StockFormRow'
import {
  StockThingForm,
  getValidationSchema,
  buildInitialValues,
  IStockThingFormValues,
} from 'components/StockThingForm'
import setFormReadOnlyFields from 'components/StockThingForm/utils/setFormReadOnlyFields'
import { useOfferIndividualContext } from 'context/OfferIndividualContext'
import { getOfferIndividualAdapter } from 'core/Offers/adapters'
import {
  LIVRE_PAPIER_SUBCATEGORY_ID,
  OFFER_WIZARD_MODE,
} from 'core/Offers/constants'
import { IOfferIndividual } from 'core/Offers/types'
import { getOfferIndividualUrl } from 'core/Offers/utils/getOfferIndividualUrl'
import { useNavigate, useOfferWizardMode } from 'hooks'
import useNotification from 'hooks/useNotification'
import { getLocalDepartementDateTimeFromUtc } from 'utils/timezone'

import { ActionBar } from '../ActionBar'

import { upsertStocksThingAdapter } from './adapters'

export interface IStocksThingProps {
  offer: IOfferIndividual
}

const StocksThing = ({ offer }: IStocksThingProps): JSX.Element => {
  const mode = useOfferWizardMode()
  const [afterSubmitUrl, setAfterSubmitUrl] = useState<string | null>(
    getOfferIndividualUrl({
      offerId: offer.id,
      step: OFFER_WIZARD_STEP_IDS.SUMMARY,
      mode,
    })
  )
  const navigate = useNavigate()
  const notify = useNotification()
  const { setOffer } = useOfferIndividualContext()

  const onSubmit = async (formValues: IStockThingFormValues) => {
    const { isOk, payload, message } = await upsertStocksThingAdapter({
      offerId: offer.id,
      formValues,
      departementCode: offer.venue.departmentCode,
    })

    /* istanbul ignore next: DEBT, TO FIX */
    if (isOk) {
      notify.success(message)
      const response = await getOfferIndividualAdapter(offer.id)
      if (response.isOk) {
        setOffer && setOffer(response.payload)
      }
      afterSubmitUrl !== null && navigate(afterSubmitUrl)
    } else {
      /* istanbul ignore next: DEBT, TO FIX */
      formik.setErrors(payload.errors)
    }
  }

  let minQuantity = null
  // validation is test in getValidationSchema
  // and it's not possible as is to test it here
  /* istanbul ignore next: DEBT, TO FIX */
  if (offer.stocks.length > 0) {
    minQuantity = offer.stocks[0].bookingsQuantity
  }
  const today = getLocalDepartementDateTimeFromUtc(
    new Date(),
    offer.venue.departmentCode
  )
  const initialValues = buildInitialValues(offer)
  const formik = useFormik({
    initialValues,
    onSubmit,
    validationSchema: getValidationSchema(minQuantity),
  })

  const handleNextStep =
    ({ saveDraft = false } = {}) =>
    () => {
      // tested but coverage don't see it.
      /* istanbul ignore next */
      setAfterSubmitUrl(
        getOfferIndividualUrl({
          offerId: offer.id,
          step: saveDraft
            ? OFFER_WIZARD_STEP_IDS.STOCKS
            : OFFER_WIZARD_STEP_IDS.SUMMARY,
          mode: saveDraft ? OFFER_WIZARD_MODE.DRAFT : mode,
        })
      )
      formik.handleSubmit()
    }

  const handlePreviousStep = () => {
    /* istanbul ignore next: DEBT, TO FIX */
    formik.handleSubmit()
    /* istanbul ignore next: DEBT, TO FIX */
    setAfterSubmitUrl(
      getOfferIndividualUrl({
        offerId: offer.id,
        step: OFFER_WIZARD_STEP_IDS.INFORMATIONS,
        mode,
      })
    )
  }

  const renderStockForm = () => {
    return (
      <StockThingForm
        today={today}
        readOnlyFields={setFormReadOnlyFields(offer)}
      />
    )
  }

  let description
  /* istanbul ignore next: DEBT, TO FIX */
  if (offer.isDigital) {
    description = `Les utilisateurs ont ${
      offer.subcategoryId === LIVRE_PAPIER_SUBCATEGORY_ID ? '10' : '30'
    } jours pour faire valider leur contremarque. Passé ce délai, la réservation est automatiquement annulée et l’offre remise en vente.`
  } else {
    description =
      'Les utilisateurs ont 30 jours pour annuler leurs réservations d’offres numériques. Dans le cas d’offres avec codes d’activation, les utilisateurs ne peuvent pas annuler leurs réservations d’offres numériques. Toute réservation est définitive et sera immédiatement validée.'
  }

  return (
    <FormikProvider value={formik}>
      <FormLayout>
        <FormLayout.Section title="Stock & Prix" description={description}>
          <form onSubmit={formik.handleSubmit}>
            <StockFormRow
              Form={renderStockForm()}
              actions={[]}
              actionDisabled={false}
              showStockInfo={mode === OFFER_WIZARD_MODE.EDITION}
            />

            <ActionBar
              onClickNext={handleNextStep()}
              onClickPrevious={handlePreviousStep}
              onClickSaveDraft={handleNextStep({ saveDraft: true })}
              step={OFFER_WIZARD_STEP_IDS.STOCKS}
            />
          </form>
        </FormLayout.Section>
      </FormLayout>
    </FormikProvider>
  )
}

export default StocksThing
