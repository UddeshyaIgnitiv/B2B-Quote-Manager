const DRAFT_ORDER_INVOICE_SEND = `
  mutation draftOrderInvoiceSend($id: ID!, $email: EmailInput) {
    draftOrderInvoiceSend(id: $id, email: $email) {
      draftOrder {
        id
        invoiceUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export default DRAFT_ORDER_INVOICE_SEND;
