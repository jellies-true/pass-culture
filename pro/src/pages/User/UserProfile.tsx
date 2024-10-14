import { AppLayout } from 'app/AppLayout'
import { useCurrentUser } from 'commons/hooks/useCurrentUser'
import { UserProfile } from 'pages/User/UserProfile/UserProfile'

const Profile = (): JSX.Element => {
  const { currentUser } = useCurrentUser()

  return (
    <AppLayout>
      <UserProfile
        userIdentityInitialValues={{
          firstName: currentUser.firstName || '',
          lastName: currentUser.lastName || '',
        }}
        userPhoneInitialValues={{ phoneNumber: currentUser.phoneNumber ?? '' }}
        userEmailInitialValues={{
          email: currentUser.email,
        }}
      />
    </AppLayout>
  )
}

// Lazy-loaded by react-router-dom
// ts-unused-exports:disable-next-line
export const Component = Profile
