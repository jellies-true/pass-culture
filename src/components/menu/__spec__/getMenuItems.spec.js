import getMenuItems from '../getMenuItems'
import DiscoveryPage from '../../pages/discovery'
import FavoritesPage from '../../pages/FavoritesPage'
import MyBookingsContainer from '../../pages/my-bookings/MyBookingsContainer'
import ProfilePage from '../../pages/profile'
import SearchContainer from '../../pages/search/SearchContainer'
import routes from '../../router/routes'

describe('getMenuItems', () => {
  it('should filter routes for menu from mock', () => {
    const testRoutes = [
      { path: '/' },
      { path: '/toto' },
      { icon: 'toto', path: '/toto/:vars?' },
      { href: '/toto/:vars?', icon: 'toto' },
      { exact: true, path: '/toto/:vars?/vars2?' },
      { icon: 'toto', path: '/toto/:vars?/:vars2?/:vars3?' },
      { href: 'mailto:mail.cool' },
      { href: 'mailto:mail.cool', icon: 'toto' },
    ]
    const items = getMenuItems(testRoutes)
    const expected = [
      { icon: 'toto', path: '/toto' },
      { href: '/toto/:vars?', icon: 'toto' },
      { icon: 'toto', path: '/toto' },
      { href: 'mailto:mail.cool', icon: 'toto' },
    ]
    expect(items).toStrictEqual(expected)
  })

  it('should filter routes for menu from featured routes', () => {
    // when
    const items = getMenuItems(routes)
    const expected = [
      {
        component: DiscoveryPage,
        disabledInMenu: false,
        icon: 'offres-w',
        path: '/decouverte',
        title: 'Les offres',
      },
      {
        component: SearchContainer,
        disabledInMenu: false,
        icon: 'search-w',
        path: '/recherche',
        title: 'Recherche',
      },
      {
        component: MyBookingsContainer,
        disabledInMenu: false,
        icon: 'calendar-w',
        path: '/reservations',
        title: 'Mes réservations',
      },
      {
        component: FavoritesPage,
        disabledInMenu: true,
        icon: 'like-w',
        path: '/favoris',
        title: 'Mes préférés',
      },
      {
        component: ProfilePage,
        disabledInMenu: false,
        icon: 'user-w',
        path: '/profil',
        title: 'Mon compte',
      },
      {
        disabledInMenu: false,
        href: 'https://docs.passculture.app/experimentateurs',
        icon: 'help-w',
        target: '_blank',
        title: 'Aide',
      },
      {
        disabledInMenu: false,
        href:
          'https://pass-culture.gitbook.io/documents/textes-normatifs/mentions-legales-et-conditions-generales-dutilisation-de-lapplication-pass-culture',
        icon: 'txt-w',
        target: '_blank',
        title: 'Mentions légales',
      },
    ]

    // then
    expect(items).toStrictEqual(expected)
  })
})
