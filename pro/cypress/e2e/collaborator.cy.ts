import { logAndGoToPage } from '../support/helpers.ts'

describe('Collaborator list feature', () => {
  let login: string

  before(() => {
    cy.visit('/connexion')
    cy.request({
      method: 'GET',
      url: 'http://localhost:5001/sandboxes/pro/create_regular_pro_user',
    }).then((response) => {
      login = response.body.user.email
    })

    cy.request({
      method: 'GET',
      url: 'http://localhost:5001/sandboxes/clear_email_list',
    }).then((response) => {
      expect(response.status).to.eq(200)
    })
  })

  it('I can add a new collaborator and he receives an email invitation', () => {
    const randomEmail = `collaborator${Math.random()}@example.com`
    logAndGoToPage(login, '/')

    cy.stepLog({ message: 'open collaborator Page' })
    cy.findAllByText('Collaborateurs').click()

    cy.stepLog({ message: 'add a collaborator in the list' })
    cy.findByText('Ajouter un collaborateur').click()
    cy.findByLabelText('Adresse email *').type(randomEmail)
    cy.findByText('Inviter').click()

    cy.stepLog({ message: 'check notification about invitation sent' })
    cy.findAllByTestId('global-notification-success').should(
      'contain',
      `L'invitation a bien été envoyée.`
    )

    cy.stepLog({ message: 'check login validated and new collaborator waiting status' })
    cy.contains(randomEmail).next().should('have.text', 'En attente')
    cy.contains(login).next().should('have.text', 'Validé')

    cy.stepLog({ message: 'check email received by email' })
    cy.request({
      method: 'GET',
      url: 'http://localhost:5001/sandboxes/get_unique_email',
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.To).to.eq(randomEmail)
      expect(response.body.params.OFFERER_NAME).to.contain('Le Petit Rintintin Management')
    })
  })
})