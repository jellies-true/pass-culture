import React, { PureComponent } from 'react'

class DeleteDialog extends PureComponent {
  render() {
    const { isEvent, onCancelDeleteClick, onConfirmDeleteClick } = this.props

    return (
      <tr>
        <td
          className="is-size-7"
          colSpan="6"
        >
          {"En confirmant l'annulation de {isEvent ? 'cette date' : 'ce stock'},"}
          {"vous supprimerez aussi toutes les réservations associées.{' '}"}
          {isEvent && <br />}
          {"Êtes-vous sûr de vouloir continuer&nbsp;?"}
        </td>

        <td>
          <button
            className="button is-primary"
            onClick={onConfirmDeleteClick}
            type="button"
          >
            {"Oui"}
          </button>
        </td>
        <td>
          <button
            className="button is-primary"
            onClick={onCancelDeleteClick}
            type="button"
          >
            {"Non"}
          </button>
        </td>
      </tr>
    )
  }
}

export default DeleteDialog
