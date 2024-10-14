import { useFormik } from 'formik'

import { AdageFrontRoles } from 'apiClient/adage'
import { apiAdage } from 'apiClient/api'
import { useNotification } from 'commons/hooks/useNotification'
import { isDateValid } from 'commons/utils/date'
import { Callout } from 'components/Callout/Callout'
import { CalloutVariant } from 'components/Callout/types'
import { Dialog } from 'components/Dialog/Dialog/Dialog'
import { MandatoryInfo } from 'components/FormLayout/FormLayoutMandatoryInfo'
import { ButtonLink } from 'ui-kit/Button/ButtonLink'
import { ButtonVariant } from 'ui-kit/Button/types'

import { createCollectiveRequestPayload } from './createCollectiveRequestPayload'
import { DefaultFormContact } from './DefaultFormContact'
import styles from './RequestFormDialog.module.scss'
import { RequestFormValues } from './type'
import { validationSchema } from './validationSchema'

export interface RequestFormDialogProps {
  closeModal: () => void
  offerId: number
  userEmail?: string | null
  userRole?: AdageFrontRoles
  contactEmail: string
  contactPhone: string
  contactForm: string
  contactUrl: string
  isPreview: boolean
  isDialogOpen: boolean
}

export const RequestFormDialog = ({
  closeModal,
  offerId,
  userEmail,
  userRole,
  contactEmail,
  contactPhone,
  contactForm,
  contactUrl,
  isPreview,
  isDialogOpen,
}: RequestFormDialogProps): JSX.Element => {
  const notify = useNotification()

  const initialValues = {
    teacherEmail: userEmail ?? '',
    description: '',
    offerDate: '',
  }
  const onSubmit = async (formValues: RequestFormValues) => {
    const payload = createCollectiveRequestPayload(formValues)
    try {
      await apiAdage.createCollectiveRequest(offerId, payload)
      notify.success('Votre demande a bien été envoyée')
      closeModal()
    } catch {
      notify.error(
        'Impossible de créer la demande.\nVeuillez contacter le support pass culture'
      )
      closeModal()
      return
    }
  }

  const closeRequestFormDialog = async () => {
    if (!isPreview) {
      await apiAdage.logRequestFormPopinDismiss({
        iframeFrom: location.pathname,
        collectiveOfferTemplateId: offerId,
        comment: formik.values.description,
        phoneNumber: formik.values.teacherPhone,
        requestedDate: isDateValid(formik.values.offerDate)
          ? new Date(formik.values.offerDate).toISOString()
          : undefined,
        totalStudents: formik.values.nbStudents,
        totalTeachers: formik.values.nbTeachers,
      })
    }
    closeModal()
  }

  const formik = useFormik<RequestFormValues>({
    onSubmit: onSubmit,
    initialValues: initialValues,
    validationSchema: validationSchema,
  })

  const logContactUrl = () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    apiAdage.logContactUrlClick({
      iframeFrom: location.pathname,
      offerId: offerId,
    })
  }

  const getDescriptionElement = () => {
    if (contactEmail && !contactPhone && !contactUrl && !contactForm) {
      return renderContactElement('par mail', contactEmail)
    }
    if (!contactEmail && contactPhone && !contactUrl && !contactForm) {
      return renderContactElement('par téléphone', contactPhone)
    }
    if (!contactEmail && !contactPhone && contactUrl && !contactForm) {
      return renderCustomFormElement()
    }
    if (!contactEmail && !contactPhone && !contactUrl && contactForm) {
      return renderDefaultFormElement()
    }
    return renderMultiContactElement(
      {
        contactEmail,
        contactPhone,
      },
      contactForm === 'form',
      contactUrl.length > 0
    )
  }

  const renderContactElement = (
    description: string,
    value: string | null | undefined
  ) => (
    <div>
      <span className={styles['form-description']}>
        Il vous propose de le faire {description} :
      </span>
      <span className={styles['form-description-text-contact']}>{value}</span>
    </div>
  )

  const renderMultiContactElement = (
    {
      contactEmail,
      contactPhone,
    }: { contactEmail: string; contactPhone: string },
    isDefaultForm: boolean,
    isCustomForm: boolean
  ) => (
    <div className={styles['form-description']}>
      <span>Il vous propose de le faire :</span>
      <ul className={styles['form-description-list']}>
        {contactEmail && (
          <li>
            par mail :{' '}
            <span className={styles['form-description-text-value']}>
              {contactEmail}
            </span>
          </li>
        )}
        {contactPhone && (
          <li>
            par téléphone :{' '}
            <span className={styles['form-description-text-value']}>
              {contactPhone}
            </span>
          </li>
        )}
        {isCustomForm && (
          <li>
            <div className={styles['form-description-link']}>
              <i>via</i> son formulaire :
              <ButtonLink
                onClick={logContactUrl}
                variant={ButtonVariant.TERNARYPINK}
                className={styles['form-description-link-text']}
                to={contactUrl}
                isExternal
                opensInNewTab
              >
                Aller sur le site
              </ButtonLink>
            </div>
          </li>
        )}

        {isDefaultForm &&
          (userRole === AdageFrontRoles.REDACTOR || isPreview) && (
            <li>
              en renseignant{' '}
              <span className={styles['form-description-text-value']}>
                le formulaire ci-dessous
              </span>
            </li>
          )}
      </ul>
      {isDefaultForm &&
        (userRole === AdageFrontRoles.REDACTOR || isPreview) && (
          <>
            <hr className={styles['separator']} />
            <MandatoryInfo className={styles['form-mandatory']} />
            {isPreview && (
              <Callout
                variant={CalloutVariant.DEFAULT}
                className={styles['contact-callout']}
              >
                Vous ne pouvez pas envoyer de demande de contact car ceci est un
                aperçu de test du formulaire que verront les enseignants une
                fois l’offre publiée.
              </Callout>
            )}
            <DefaultFormContact
              closeRequestFormDialog={closeRequestFormDialog}
              formik={formik}
              isPreview={isPreview}
            />
          </>
        )}
    </div>
  )

  const renderCustomFormElement = () => (
    <div>
      <div className={styles['form-description-link-site']}>
        Il vous propose de le faire <i>via</i> son formulaire :
      </div>
      <ButtonLink
        onClick={logContactUrl}
        variant={ButtonVariant.TERNARYPINK}
        className={styles['form-description-link-text']}
        to={contactUrl}
        isExternal
        opensInNewTab
      >
        Aller sur le site
      </ButtonLink>
    </div>
  )

  const renderDefaultFormElement = () => (
    <div>
      {userRole === AdageFrontRoles.REDACTOR || isPreview ? (
        <>
          <span className={styles['form-description']}>
            Vous pouvez le contacter en renseignant les informations ci-dessous.
          </span>
          <MandatoryInfo className={styles['form-mandatory']} />
          {isPreview && (
            <Callout
              variant={CalloutVariant.DEFAULT}
              className={styles['contact-callout']}
            >
              Vous ne pouvez pas envoyer de demande de contact car ceci est un
              aperçu de test du formulaire que verront les enseignants une fois
              l’offre publiée.
            </Callout>
          )}
          <DefaultFormContact
            closeRequestFormDialog={closeRequestFormDialog}
            formik={formik}
            isPreview={isPreview}
          />
        </>
      ) : (
        <Callout
          variant={CalloutVariant.DEFAULT}
          className={styles['contact-readonly']}
        >
          Vous ne pouvez voir les informations de contact du partenaire car vous
          n’avez pas les droits ADAGE adaptés
        </Callout>
      )}
    </div>
  )

  return (
    <Dialog
      extraClassNames={styles['dialog-container']}
      onCancel={closeRequestFormDialog}
      title=""
      hideIcon
      open={isDialogOpen}
    >
      <span className={styles['form-title']}>
        Vous souhaitez contacter ce partenaire ?
      </span>
      {getDescriptionElement()}
    </Dialog>
  )
}
