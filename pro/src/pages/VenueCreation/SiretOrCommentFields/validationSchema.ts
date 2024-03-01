import * as yup from 'yup'

import siretApiValidate from 'core/Venue/siretApiValidate'
import { unhumanizeSiret } from 'core/Venue/utils'

export const valideSiretLength = (siret: string) =>
  unhumanizeSiret(siret).length === 14

export const isSiretStartingWithSiren = (
  siret: string,
  siren?: string | null
) =>
  siren !== null &&
  siren !== undefined &&
  unhumanizeSiret(siret).startsWith(siren)

export const generateSiretValidationSchema = (
  isVenueVirtual: boolean,
  isSiretValued: boolean,
  siren?: string | null
) => {
  const siretValidationSchema = {
    siret: isVenueVirtual
      ? yup.string()
      : yup
          .string()
          .required('Veuillez renseigner un SIRET')
          .test(
            'len',
            'Le SIRET doit comporter 14 caractères',
            (siret) => Boolean(siret) && valideSiretLength(siret)
          )
          .test(
            'correspondingToSiren',
            'Le code SIRET doit correspondre à un établissement de votre structure',
            (siret) => Boolean(siret) && isSiretStartingWithSiren(siret, siren)
          )
          .test(
            'apiSiretValid',
            'Le code SIRET saisi n’est pas valide',
            async (siret) => {
              const response = await siretApiValidate(siret || '')
              return !response
            }
          ),
  }

  const commentValidationSchema = {
    comment: isVenueVirtual
      ? yup.string()
      : yup.string().required('Veuillez renseigner un commentaire'),
  }

  /* istanbul ignore next */
  return yup
    .object()
    .shape(isSiretValued ? siretValidationSchema : commentValidationSchema)
}
