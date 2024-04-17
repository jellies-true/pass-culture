import { Form, FormikProvider, useFormik } from 'formik'
import React from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

import { api } from 'apiClient/api'
import DialogBox from 'components/DialogBox'
import { selectCurrentOffererId } from 'store/user/selectors'
import { Button, RadioButton, SubmitButton, TextArea } from 'ui-kit'
import { ButtonVariant } from 'ui-kit/Button/types'
import { BaseRadioVariant } from 'ui-kit/form/shared/BaseRadio/types'
import { sendSentryCustomError } from 'utils/sendSentryCustomError'

import styles from './NewNavReviewDialog.module.scss'
import { validationSchema } from './validationSchema'

interface NewNavReviewDialogProps {
  setIsReviewDialogOpen: (value: boolean) => void
}

interface NewNavReviewDialogFormValues {
  isConvenient: string
  isPleasant: string
  comment: string
}

const NewNavReviewDialog = ({
  setIsReviewDialogOpen,
}: NewNavReviewDialogProps) => {
  const onSubmitReview = (formValues: NewNavReviewDialogFormValues) => {
    api
      .submitNewNavReview({
        offererId: selectedOffererId!,
        location: location.pathname,
        isPleasant: formValues.isPleasant === 'true' ? true : false,
        isConvenient: formValues.isConvenient === 'true' ? true : false,
        comment: formValues.comment,
      })
      .catch((e) => {
        sendSentryCustomError(e)
      })
    setIsReviewDialogOpen(false)
  }

  const initialValues: NewNavReviewDialogFormValues = {
    isConvenient: '',
    isPleasant: '',
    comment: '',
  }

  const formik = useFormik<NewNavReviewDialogFormValues>({
    initialValues,
    onSubmit: onSubmitReview,
    validationSchema: validationSchema,
  })

  const selectedOffererId = useSelector(selectCurrentOffererId)
  const location = useLocation()

  return (
    <DialogBox
      onDismiss={() => setIsReviewDialogOpen(false)}
      hasCloseButton
      extraClassNames={styles.dialog}
      labelledBy="Votre avis compte"
    >
      <FormikProvider value={formik}>
        <Form>
          <h1 className={styles['dialog-title']}>Votre avis compte !</h1>
          <fieldset>
            <legend className={styles['radio-legend']}>
              Selon vous, cette nouvelle interface est ... ? *
            </legend>
            <ol>
              <li className={styles['form-row']}>
                <span className={styles['form-row-label']}>1.</span>
                <div className={styles['radio-group']}>
                  <RadioButton
                    label={
                      <>
                        Moins pratique <span aria-hidden>🐢</span>
                      </>
                    }
                    name="isConvenient"
                    value="false"
                    className={styles['radio-button']}
                    withBorder
                    variant={BaseRadioVariant.SECONDARY}
                  />
                  <RadioButton
                    label={
                      <>
                        Plus pratique <span aria-hidden>🐇</span>
                      </>
                    }
                    name="isConvenient"
                    value="true"
                    className={styles['radio-button']}
                    withBorder
                    variant={BaseRadioVariant.SECONDARY}
                  />
                </div>
              </li>
              <li className={styles['form-row']}>
                <span className={styles['form-row-label']}>2.</span>
                <div className={styles['radio-group']}>
                  <RadioButton
                    label={
                      <>
                        Moins agréable <span aria-hidden>🌧️</span>
                      </>
                    }
                    name="isPleasant"
                    value="false"
                    className={styles['radio-button']}
                    withBorder
                    variant={BaseRadioVariant.SECONDARY}
                  />
                  <RadioButton
                    label={
                      <>
                        Plus agréable <span aria-hidden>🌈</span>
                      </>
                    }
                    name="isPleasant"
                    value="true"
                    className={styles['radio-button']}
                    withBorder
                    variant={BaseRadioVariant.SECONDARY}
                  />
                </div>
              </li>
            </ol>
          </fieldset>

          <TextArea
            name="comment"
            label={
              'Souhaitez-vous préciser ? Nous lisons tous les commentaires. 🙂'
            }
            maxLength={500}
            countCharacters
            isOptional
          />

          <div className={styles['dialog-buttons']}>
            <Button
              variant={ButtonVariant.SECONDARY}
              onClick={() => setIsReviewDialogOpen(false)}
            >
              Annuler
            </Button>
            <SubmitButton
              disabled={
                formik.values.isPleasant === initialValues.isPleasant ||
                formik.values.isConvenient === initialValues.isConvenient
              }
            >
              Envoyer
            </SubmitButton>
          </div>
        </Form>
      </FormikProvider>
    </DialogBox>
  )
}

export default NewNavReviewDialog
