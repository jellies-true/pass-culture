describe('Create an individual offer (event)', () => {
  it('should create an individual offer', () => {
    // toujours d'actu ce flag? où aller voir pour savoir?
    cy.setFeatureFlags([{ name: 'WIP_ENABLE_PRO_SIDE_NAV', isActive: false }])

    cy.login({
      email: 'pro_adage_eligible@example.com',
      password: 'user@AZERTY123',
    })

    // Go to offer creation page
    cy.findByText('Créer une offre').click()

    // Select an offer type
    cy.findByText('Un évènement physique daté').click()

    cy.intercept({ method: 'GET', url: '/offers/categories' }).as(
      'getCategories'
    )
    cy.findByText('Étape suivante').click()
    cy.wait('@getCategories')

    // Fill in first step: offer details
    cy.findByLabelText('Catégorie *').select('Spectacle vivant')
    cy.findByLabelText('Sous-catégorie *').select('Spectacle, représentation')
    cy.findByLabelText('Type de spectacle *').select('Théâtre')
    cy.findByLabelText('Sous-type *').select('Comédie')
    cy.findByLabelText('Titre de l’offre *').type('Le Diner de Devs')
    cy.findByLabelText('Description').type('Une PO invite des développeurs à dîner...')
    cy.findByText('Retrait sur place (guichet, comptoir...)').click()
    cy.findByLabelText('Email de contact *').type('passculture@example.com')

    cy.intercept({ method: 'POST', url: '/offers' }).as('postOffer')
    cy.intercept({ method: 'GET', url: '/offers/*' }).as('getOffer')
    cy.findByText('Enregistrer et continuer').click()
    cy.wait(['@getOffer', '@postOffer'])

    //cy.pause()

    // Fill in second step: prices
    cy.findByLabelText('Intitulé du tarif *').should('have.value', 'Tarif unique')
    cy.findByText('Ajouter un tarif').click()
    cy.findByText('Ajouter un tarif').click()

    cy.findByTestId('wrapper-priceCategories[0].label').within(() => {
      // trouve le premier champ avec le label:
      cy.findByLabelText('Intitulé du tarif *').type('Carré Or')
    })
    cy.findByTestId('wrapper-priceCategories[0].price').within(() => {
      // trouve le premier champ avec le label:      
      cy.findByLabelText('Prix par personne *').type('100')
    })

    // besoin de tester celui-là qui fait la même chose que le précédent?
    cy.findByTestId('wrapper-priceCategories[1].label').within(() => {
      // trouve le deuxième champ avec le label:      
      cy.findByLabelText('Intitulé du tarif *').type('Fosse Debout')
    })
    cy.findByTestId('wrapper-priceCategories[1].price').within(() => {
      // trouve le deuxième champ avec le label:      
      cy.findByLabelText('Prix par personne *').type('10')
    })

    cy.findByTestId('wrapper-priceCategories[2].label').within(() => {
      // trouve le troisième champ avec le label:      
      cy.findByLabelText('Intitulé du tarif *').type('Fosse Sceptique')
    })
    // manque un data-testid
    cy.get('[name="priceCategories[2].free"]').click()

    cy.findByText('Accepter les réservations “Duo“').should('exist')

    cy.intercept({ method: 'PATCH', url: '/offers/*' }).as('patchOffer')
    cy.intercept({ method: 'GET', url: '/offers/*/stocks/*' }).as('getStocks')
    cy.findByText('Enregistrer et continuer').click()
    // pourquoi on attend tellement ici?
    cy.wait(['@patchOffer', '@getOffer', '@getStocks'])

    // Fill in third step: recurrence
    cy.findByText('Ajouter une ou plusieurs dates').click()

    cy.findByText('Toutes les semaines').click()
    cy.findByLabelText('Vendredi').click()
    cy.findByLabelText('Samedi').click()
    cy.findByLabelText('Dimanche').click()
    cy.findByLabelText('Du *').type('2030-05-01')
    cy.findByLabelText('Au *').type('2030-09-30')
    cy.findByLabelText('Horaire 1 *').type('18:30')
    cy.findByText('Ajouter un créneau').click()
    cy.findByLabelText('Horaire 2 *').type('21:00')
    cy.findByText('Ajouter d’autres places et tarifs').click()
    cy.findByText('Ajouter d’autres places et tarifs').click()

    cy.findByTestId('wrapper-quantityPerPriceCategories[0].priceCategory').within(() => {
       // trouve la première liste déroulante avec le label:      
       cy.findByLabelText('Tarif *').select('0,00\xa0€ - Fosse Sceptique')
    })

    cy.findByTestId('wrapper-quantityPerPriceCategories[1].quantity').within(() => {
       // trouve le deuxième champ avec le label:      
       cy.findByLabelText('Nombre de places').type('100')
    })
    cy.findByTestId('wrapper-quantityPerPriceCategories[1].priceCategory').within(() => {
       // trouve la euxième liste déroulante avec le label:      
       cy.findByLabelText('Tarif *').select('10,00\xa0€ - Fosse Debout')
    })

    cy.findByTestId('wrapper-quantityPerPriceCategories[2].quantity').within(() => {
       // trouve le troisième champ avec le label:      
       cy.findByLabelText('Nombre de places').type('20')
    })
    cy.findByTestId('wrapper-quantityPerPriceCategories[2].priceCategory').within(() => {
       // trouve la troisième liste déroulante avec le label:      
       cy.findByLabelText('Tarif *').select('100,00\xa0€ - Carré Or')
    })

    // manque un data-testid ou un placeholder
    cy.get('[name="bookingLimitDateInterval"]').type('3')
    cy.intercept({ method: 'POST', url: '/stocks/bulk' }).as('postStocks')
    cy.findByText('Valider').click()
    cy.wait(['@postStocks'])

    cy.findByText('Enregistrer et continuer').click()
    cy.contains('Accepter les réservations "Duo" : Oui')

    // Publish offer
    cy.intercept({ method: 'PATCH', url: '/offers/publish' }).as('publishOffer')
    cy.findByText('Publier l’offre').click()
    cy.wait(['@publishOffer', '@getOffer'])

    // Go to offer list and check that the offer is there
    cy.intercept({ method: 'GET', url: '/offers' }).as('getOffers')
    cy.findByText('Voir la liste des offres').click()

    cy.wait('@getOffers')
    cy.url().should('contain', '/offres')
    cy.contains('Le Diner de Devs')
    cy.contains('396 dates')
  })
})
