import * as yup from 'yup'

import { checkCoords } from 'commons/utils/coords'
import { OFFER_LOCATION } from 'pages/IndividualOffer/commons/constants'

const locationSchema = {
  offerLocation: yup
    .string()
    .trim()
    .when('isVenueVirtual', {
      is: false,
      then: (schema) => schema.required('Veuillez sélectionner un choix'),
    }),
  addressAutocomplete: yup
    .string()
    .trim()
    .when(['offerLocation', 'manuallySetAddress', 'isVenueVirtual'], {
      is: (
        offerLocation: string,
        manuallySetAddress: boolean,
        isVenueVirtual: boolean
      ) =>
        !isVenueVirtual &&
        offerLocation === OFFER_LOCATION.OTHER_ADDRESS &&
        !manuallySetAddress,
      then: (schema) =>
        schema.required(
          'Veuillez sélectionner une adresse parmi les suggestions'
        ),
    }),
  street: yup
    .string()
    .trim()
    .when(['offerLocation', 'isVenueVirtual'], {
      is: (offerLocation: string, isVenueVirtual: boolean) =>
        !isVenueVirtual && offerLocation === OFFER_LOCATION.OTHER_ADDRESS,
      then: (schema) =>
        schema.required('Veuillez renseigner une adresse postale'),
    }),
  postalCode: yup
    .string()
    .trim()
    .when(['offerLocation', 'isVenueVirtual'], {
      is: (offerLocation: string, isVenueVirtual: boolean) =>
        !isVenueVirtual && offerLocation === OFFER_LOCATION.OTHER_ADDRESS,
      then: (schema) => schema.required('Veuillez renseigner un code postal'),
    })
    .min(5, 'Veuillez renseigner un code postal valide')
    .max(5, 'Veuillez renseigner un code postal valide'),
  city: yup
    .string()
    .trim()
    .when(['offerLocation', 'isVenueVirtual'], {
      is: (offerLocation: string, isVenueVirtual: boolean) =>
        !isVenueVirtual && offerLocation === OFFER_LOCATION.OTHER_ADDRESS,
      then: (schema) => schema.required('Veuillez renseigner une ville'),
    }),
  coords: yup
    .string()
    .trim()
    .when(['offerLocation', 'manuallySetAddress', 'isVenueVirtual'], {
      is: (
        offerLocation: string,
        manuallySetAddress: boolean,
        isVenueVirtual: boolean
      ) =>
        !isVenueVirtual &&
        offerLocation === OFFER_LOCATION.OTHER_ADDRESS &&
        manuallySetAddress,
      then: (schema) =>
        schema
          .required('Veuillez renseigner les coordonnées GPS')
          .test('coords', 'Veuillez respecter le format attendu', (value) =>
            checkCoords(value)
          ),
    }),
}

export const validationSchema = {
  locationLabel: yup.string(),
  ...locationSchema,
}