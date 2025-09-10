import { gql } from 'graphql-tag';

const UPDATE_DRAFT_ORDER = gql`
  mutation draftOrderUpdate($id: ID!, $input: DraftOrderInput!) {
    draftOrderUpdate(id: $id, input: $input) {
      draftOrder {
        id
        name
        status
        createdAt
        updatedAt
        appliedDiscount {
          description
          valueType
          value
        }
        lineItems(first: 100) {
          edges {
            node {
              id
              title
              quantity
              originalUnitPrice
              variant {
                id
              }
              requiresShipping
              taxable
            }
          }
        }
        shippingLine {
          title
          price
        }
        taxLines {
          title
          rate
          ratePercentage
          source
          priceSet {
            presentmentMoney {
              amount
              currencyCode
            }
            shopMoney {
              amount
              currencyCode
            }
          }
        }
        subtotalPrice
        totalPrice
        totalTax
        totalShippingPrice
        tags
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export default UPDATE_DRAFT_ORDER;
