import { format } from 'date-fns-tz'
import React, { useCallback, useState } from 'react'

import { OfferStockResponse } from 'apiClient/adage'
import { apiAdage } from 'apiClient/api'
import useNotification from 'hooks/useNotification'
import fullStockIcon from 'icons/full-stock.svg'
import strokeHourglass from 'icons/stroke-hourglass.svg'
import { logOfferConversion } from 'pages/AdageIframe/libs/initAlgoliaAnalytics'
import { Button } from 'ui-kit'
import { SvgIcon } from 'ui-kit/SvgIcon/SvgIcon'
import { LOGS_DATA } from 'utils/config'

import { postBookingAdapater } from './adapters/postBookingAdapter'
import styles from './PrebookingButton.module.scss'
import PrebookingModal from './PrebookingModal'

export interface PrebookingButtonProps {
  className?: string
  stock: OfferStockResponse
  canPrebookOffers: boolean
  offerId: number
  queryId: string
  isInSuggestions?: boolean
  children?: React.ReactNode
  hideLimitDate?: boolean
  isPreview?: boolean
  setInstitutionOfferCount?: (value: number) => void
  institutionOfferCount?: number
  setOfferPrebooked?: (value: boolean) => void
}

const PrebookingButton = ({
  className,
  stock,
  canPrebookOffers,
  offerId,
  queryId,
  isInSuggestions,
  children,
  hideLimitDate,
  isPreview = false,
  setInstitutionOfferCount,
  institutionOfferCount,
  setOfferPrebooked,
}: PrebookingButtonProps): JSX.Element | null => {
  const [hasPrebookedOffer, setHasPrebookedOffer] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const notification = useNotification()

  const handleBookingModalButtonClick = (stockId: number) => {
    if (LOGS_DATA && !isPreview) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      apiAdage.logBookingModalButtonClick({
        iframeFrom: location.pathname,
        stockId,
        queryId: queryId,
        isFromNoResult: isInSuggestions,
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const preBookCurrentStock = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    logOfferConversion(offerId.toString(), queryId)
    const { isOk, message } = await postBookingAdapater(stock.id)

    if (!isOk) {
      notification.error(message)
      return
    }

    setHasPrebookedOffer(true)

    !isPreview &&
      setInstitutionOfferCount?.(
        institutionOfferCount ? institutionOfferCount - 1 : 0
      )
    setOfferPrebooked && setOfferPrebooked(true)
    closeModal()
    notification.success(message)
  }, [stock.id, offerId, queryId])

  return canPrebookOffers ? (
    <>
      <div className={(styles['prebooking-button-container'], className)}>
        {hasPrebookedOffer ? (
          <div className={styles['prebooking-tag']}>
            <SvgIcon
              className="prebooking-tag-icon"
              src={strokeHourglass}
              alt=""
              width="16"
            />
            Préréservé
          </div>
        ) : (
          <div className={styles['prebooking-button-container']}>
            <Button
              icon={fullStockIcon}
              className={styles['prebooking-button']}
              onClick={() => handleBookingModalButtonClick(stock.id)}
            >
              {children ?? 'Préréserver l’offre'}
            </Button>

            {!hideLimitDate && stock.bookingLimitDatetime && (
              <span className={styles['prebooking-button-booking-limit']}>
                avant le :{' '}
                <span className={styles['prebooking-button-limit-date']}>
                  {format(new Date(stock.bookingLimitDatetime), 'dd/MM/yyyy')}
                </span>
              </span>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <PrebookingModal
          closeModal={closeModal}
          preBookCurrentStock={preBookCurrentStock}
          isPreview={isPreview}
        />
      )}
    </>
  ) : null
}

export default PrebookingButton
