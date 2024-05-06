/* istanbul ignore file: DEBT, TO FIX */
import {
  getAnalytics,
  initializeAnalytics,
  isSupported,
  logEvent as analyticsLogEvent,
  setUserId,
  setUserProperties,
} from '@firebase/analytics'
import * as firebase from '@firebase/app'
import {
  fetchAndActivate,
  getAll,
  getRemoteConfig,
} from '@firebase/remote-config'
import { useContext, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

import { firebaseConfig } from 'config/firebase'
import { AnalyticsContext } from 'context/analyticsContext'
import useUtmQueryParams from 'hooks/useUtmQueryParams'
import { selectCurrentOffererId, selectCurrentUser } from 'store/user/selectors'

import useRemoteConfig from '../../../hooks/useRemoteConfig'

export const useFirebase = (consentedToFirebase: boolean) => {
  const currentUser = useSelector(selectCurrentUser)

  const [app, setApp] = useState<firebase.FirebaseApp | undefined>()
  const [isFirebaseSupported, setIsFirebaseSupported] = useState<boolean>(false)
  const selectedOffererId = useSelector(selectCurrentOffererId)

  const { setLogEvent } = useAnalytics()
  const { setRemoteConfig, setRemoteConfigData } = useRemoteConfig()
  const utmParameters = useUtmQueryParams()

  useEffect(() => {
    async function initializeIfNeeded() {
      setIsFirebaseSupported(await isSupported())
    }
    if (consentedToFirebase) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      initializeIfNeeded()
    }
  }, [consentedToFirebase])

  useEffect(() => {
    const loadAnalytics = async () => {
      const initializeApp = firebase.initializeApp(firebaseConfig)

      setApp(initializeApp)
      initializeAnalytics(initializeApp, {
        config: { send_page_view: false },
      })
      const remoteConfig = getRemoteConfig(initializeApp)
      await fetchAndActivate(remoteConfig)
      setRemoteConfig && setRemoteConfig(remoteConfig)
      setLogEvent &&
        setLogEvent(
          () =>
            (
              event: string,
              params:
                | { [key: string]: string | boolean | string[] | undefined }
                | Record<string, never> = {}
            ) => {
              const remoteConfigValues = getAll(remoteConfig)
              const remoteConfigParams: Record<string, string> = {}
              Object.keys(remoteConfigValues).forEach((k) => {
                remoteConfigParams[k] = remoteConfigValues[k].asString()
              })
              setRemoteConfigData &&
                setRemoteConfigData({
                  ...remoteConfigParams,
                  REMOTE_CONFIG_LOADED: 'true',
                })
              analyticsLogEvent(getAnalytics(app), event, {
                ...params,
                ...utmParameters,
                ...remoteConfigParams,
              })
            }
        )
    }

    if (consentedToFirebase && !app && isFirebaseSupported) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      loadAnalytics()
    }
  }, [consentedToFirebase, app, isFirebaseSupported])

  useEffect(() => {
    if (consentedToFirebase && app && currentUser && isFirebaseSupported) {
      setUserId(getAnalytics(app), currentUser.id.toString())
    }
  }, [consentedToFirebase, app, currentUser])

  useEffect(() => {
    if (app && isFirebaseSupported && selectedOffererId) {
      setUserProperties(getAnalytics(app), {
        offerer_id: selectedOffererId.toString(),
      })
    }
  }, [selectedOffererId, app])
}

function useAnalytics() {
  return useContext(AnalyticsContext)
}

export default useAnalytics