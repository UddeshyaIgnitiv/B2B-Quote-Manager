export const DRAFT_ORDER_COMPLETE = `
  mutation draftOrderComplete($id: ID!) {
    draftOrderComplete(id: $id) {
      draftOrder {
        id
        status
        invoiceUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export default DRAFT_ORDER_COMPLETE;