/*
 * @debt directory "Gaël: this file should be migrated within the new directory structure"
 */
import PropTypes from 'prop-types'
import React, { useCallback, useEffect, useState } from 'react'

import AppLayout from 'app/AppLayout'
import Icon from 'components/layout/Icon'
import PageTitle from 'components/layout/PageTitle/PageTitle'
import Spinner from 'components/layout/Spinner'
import Titles from 'components/layout/Titles/Titles'
import * as pcapi from 'repository/pcapi/pcapi'
import { Banner } from 'ui-kit'

import './Reimbursement.scss'
import useActiveFeature from '../../hooks/useActiveFeature'

import ReimbursementsDetails from './ReimbursementsDetails'
import ReimbursementsProofs from './ReimbursementsProofs'

const sortByKeyAlphabeticalOrder = keyName => (x, y) =>
  x[keyName].localeCompare(y[keyName])

const buildAndSortVenueFilterOptions = venues =>
  venues
    .map(venue => ({
      id: venue.id,
      displayName: venue.isVirtual
        ? `${venue.offererName} - Offre numérique`
        : venue.publicName || venue.name,
    }))
    .sort(sortByKeyAlphabeticalOrder('displayName'))

const Reimbursements = ({ currentUser }) => {
  const areInvoicesEnabled = useActiveFeature('SHOW_INVOICES_ON_PRO_PORTAL')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefundProofActive, setIsRefundProofActive] = useState(true)
  const [isRefundDetailsActive, setIsRefundDetailsActive] = useState(false)
  const [venuesOptions, setVenuesOptions] = useState([])

  const showSection = useCallback(
    sectionId => () => {
      if (sectionId === 'refund-proof') {
        setIsRefundProofActive(true)
        setIsRefundDetailsActive(false)
      } else {
        setIsRefundDetailsActive(true)
        setIsRefundProofActive(false)
      }
    },
    []
  )

  const loadVenues = useCallback(async () => {
    try {
      const venuesResponse = await pcapi.getVenuesForOfferer({
        activeOfferersOnly: true,
      })
      const selectOptions = buildAndSortVenueFilterOptions(venuesResponse)
      setVenuesOptions(selectOptions)
      setIsLoading(false)
    } catch (err) {
      console.error(err)
    }
  }, [setVenuesOptions])

  useEffect(() => {
    loadVenues()
  }, [loadVenues])

  const hasNoResults = !isLoading && !venuesOptions.length
  const hasResults = !isLoading && venuesOptions.length > 0

  const invoices = [
    {
      date: '11/12/1212',
      businessUnit: 'Som du lieu sur 2 lignes lorem ipsum dolor',
      reference: 'J0000001',
      amount: '1000',
    },
    {
      date: '19/12/1212',
      businessUnit: 'Zom du lieu sur 2 lignes lorem ipsum dolor',
      reference: 'J0000019',
      amount: '10',
    },
    {
      date: '12/12/1212',
      businessUnit: 'Com du lieu sur 2 lignes lorem ipsum dolor',
      reference: 'J0000007',
      amount: '100000',
    },
    {
      date: '08/12/1212',
      businessUnit: 'Aom du lieu sur 2 lignes lorem ipsum dolor',
      reference: 'J0000099',
      amount: '1',
    },
  ]
  const columns = [
    {
      title: 'Date',
      sortBy: 'date',
      selfDirection: 'default',
    },
    {
      title: 'Point de facturation',
      sortBy: 'businessUnit',
      selfDirection: 'default',
    },
    {
      title: 'Référence',
      sortBy: 'reference',
      selfDirection: 'default',
    },
    {
      title: 'Montant remboursé',
      sortBy: 'amount',
      selfDirection: 'default',
    },
  ]

  return (
    <AppLayout
      layoutConfig={{
        pageName: 'reimbursements',
      }}
    >
      <PageTitle title="Vos remboursements" />
      <Titles title="Remboursements" />
      {isLoading && <Spinner />}
      {hasNoResults && (
        <div className="no-refunds">
          <Icon alt="" svg="ico-no-bookings" />
          <span>Aucun remboursement à afficher</span>
        </div>
      )}
      {hasResults && (
        <>
          <p>
            Les remboursements s’effectuent tous les 15 jours, rétroactivement
            suite à la validation d’une contremarque dans le guichet ou à la
            validation automatique des contremarques d’évènements. Cette page
            est automatiquement mise à jour à chaque remboursement.
          </p>
          <Banner type="notification-info">
            En savoir plus sur
            <a
              className="bi-link tertiary-link"
              href="https://passculture.zendesk.com/hc/fr/articles/4411992051601"
              rel="noopener noreferrer"
              target="_blank"
            >
              <Icon svg="ico-external-site" />
              Les prochains remboursements
            </a>
            <a
              className="bi-link tertiary-link"
              href="https://passculture.zendesk.com/hc/fr/articles/4412007300369"
              rel="noopener noreferrer"
              target="_blank"
            >
              <Icon svg="ico-external-site" />
              Les modalités de remboursement
            </a>
          </Banner>
          {areInvoicesEnabled ? (
            <>
              <div aria-label="Catégories de remboursement" role="tablist">
                <button
                  aria-controls="refund-proof"
                  aria-selected={isRefundProofActive}
                  className={`refund-section-nav ${
                    isRefundProofActive ? 'is-active' : ''
                  }`}
                  id="refund-proof-nav"
                  onClick={showSection('refund-proof')}
                  role="tab"
                  type="button"
                >
                  Justificatifs de remboursement
                </button>
                <button
                  aria-controls="refund-details"
                  aria-selected={isRefundDetailsActive}
                  className={`refund-section-nav ${
                    isRefundDetailsActive ? 'is-active' : ''
                  }`}
                  id="refund-details-nav"
                  onClick={showSection('refund-details')}
                  role="tab"
                  type="button"
                >
                  Détails des remboursements
                </button>
              </div>
              <div
                aria-hidden={!isRefundProofActive}
                aria-labelledby="refund-proof"
                className={`refund-section ${
                  isRefundProofActive ? 'is-active' : ''
                }`}
                id="refund-proof"
                role="tabpanel"
              >
                <ReimbursementsProofs
                  columns={columns}
                  invoices={invoices}
                  isCurrentUserAdmin={currentUser.isAdmin}
                  venuesOptions={venuesOptions}
                />
              </div>
              <div
                aria-hidden={!isRefundDetailsActive}
                className={`refund-section ${
                  isRefundDetailsActive ? 'is-active' : ''
                }`}
                id="refund-details"
                role="tabpanel"
              >
                <ReimbursementsDetails
                  isCurrentUserAdmin={currentUser.isAdmin}
                  venuesOptions={venuesOptions}
                />
              </div>
            </>
          ) : (
            <ReimbursementsDetails
              isCurrentUserAdmin={currentUser.isAdmin}
              venuesOptions={venuesOptions}
            />
          )}
        </>
      )}
    </AppLayout>
  )
}

Reimbursements.propTypes = {
  currentUser: PropTypes.shape({
    isAdmin: PropTypes.bool.isRequired,
  }).isRequired,
}

export default Reimbursements
