import { gql } from 'graphql-tag';

const GET_DRAFT_ORDER = gql`
  query getDraftOrder($id: ID!) {
    draftOrder(id: $id) {
      id
      name
      createdAt
      status
      tags
      note2
      email
      paymentTerms {
        id
        dueInDays
        translatedName
      }
      customer {
        id
        firstName
        lastName
        email
      }
      shippingAddress {
        name
        address1
        address2
        city
        provinceCode
        zip
        country
        phone
      }
      billingAddress {
        name
        company
        address1
        address2
        city
        provinceCode
        zip
        country
        phone
      }
      purchasingEntity {
        __typename
        ... on PurchasingCompany {
          company {
            name
          }
          location {
            id
            name
          }
        }
        ... on Customer {
          defaultAddress {
            company
          }
        }
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
              image {
                url
                altText
              }
            }
            image {
              url
              altText
            }
          }
        }
      }
      appliedDiscount {
        description
        valueType
        value 
      }
      shippingLine {
        title
        price
        discountedPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
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
      totalDiscountsSet {
        shopMoney {
          amount
          currencyCode
        }
      }
    }
  }
`;

export default GET_DRAFT_ORDER;
