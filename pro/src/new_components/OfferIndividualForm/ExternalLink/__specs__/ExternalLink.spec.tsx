import '@testing-library/jest-dom'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Formik } from 'formik'
import React from 'react'
import * as yup from 'yup'

import { SubmitButton } from 'ui-kit'

import { EXTERNAL_LINK_DEFAULT_VALUES } from '../constants'
import ExternalLink from '../ExternalLink'
import validationSchema from '../validationSchema'

interface IInitialValues {
  externalTicketOfficeUrl: string
}

const renderExternalLink = ({
  initialValues,
  onSubmit,
}: {
  initialValues: IInitialValues
  onSubmit: () => void
}) => {
  return render(
    <Formik
      initialValues={initialValues}
      onSubmit={onSubmit}
      validationSchema={yup.object().shape(validationSchema)}
    >
      {({ handleSubmit }) => (
        <form onSubmit={handleSubmit}>
          <ExternalLink />
          <SubmitButton isLoading={false}>Submit</SubmitButton>
        </form>
      )}
    </Formik>
  )
}

describe('OfferIndividual section: ExternalLink', () => {
  let initialValues: IInitialValues
  const onSubmit = jest.fn()

  beforeEach(() => {
    initialValues = { ...EXTERNAL_LINK_DEFAULT_VALUES }
  })

  it('should render the component', async () => {
    renderExternalLink({
      initialValues,
      onSubmit,
    })
    expect(
      await screen.findByText('Lien pour le grand public')
    ).toBeInTheDocument()
    expect(
      await screen.findByLabelText('URL de votre site ou billetterie', {
        exact: false,
      })
    ).toBeInTheDocument()
  })

  it('should submit valid form', async () => {
    renderExternalLink({
      initialValues,
      onSubmit,
    })
    const urlInput = await screen.findByLabelText(
      'URL de votre site ou billetterie',
      {
        exact: false,
      }
    )

    await userEvent.type(urlInput, 'https://example.com')
    await userEvent.click(await screen.findByText('Submit'))

    expect(onSubmit).toHaveBeenCalledWith(
      { externalTicketOfficeUrl: 'https://example.com' },
      {
        resetForm: expect.any(Function),
        setErrors: expect.any(Function),
        setFieldError: expect.any(Function),
        setFieldTouched: expect.any(Function),
        setFieldValue: expect.any(Function),
        setFormikState: expect.any(Function),
        setStatus: expect.any(Function),
        setSubmitting: expect.any(Function),
        setTouched: expect.any(Function),
        setValues: expect.any(Function),
        submitForm: expect.any(Function),
        validateField: expect.any(Function),
        validateForm: expect.any(Function),
      }
    )
  })

  it('should display errors when url is wrong', async () => {
    renderExternalLink({
      initialValues,
      onSubmit,
    })
    const urlInput = await screen.findByLabelText(
      'URL de votre site ou billetterie',
      {
        exact: false,
      }
    )

    await userEvent.type(urlInput, 'fake url')
    await userEvent.tab()

    const errorMessage = await screen.findByText(
      'Veuillez renseigner une URL valide. Ex : https://exemple.com'
    )
    expect(errorMessage).toBeInTheDocument()

    await userEvent.clear(urlInput)
    await userEvent.type(urlInput, 'https://example.com')

    expect(
      screen.queryByText(
        'Veuillez renseigner une URL valide. Ex : https://exemple.com'
      )
    ).not.toBeInTheDocument()
  })
})
