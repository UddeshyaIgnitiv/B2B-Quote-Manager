import gql from 'graphql-tag';

const GET_DRAFT_ORDERS = gql`
  query getDraftOrders($query: String!) {
    draftOrders(first: 100, query: $query) {
      edges {
        node {
          id
          name
          createdAt
          status 
          tags
          totalPrice
          metafield(namespace: "custom", key: "quote_status") {
            value
          }
          customer {
            id
            firstName
            lastName
            email
            defaultAddress {
              company
            }
          }
          purchasingEntity {
            __typename
            ... on PurchasingCompany {
              company {
                name
              }
            }
            ... on Customer {
              defaultAddress {
                company
              }
            }
          }
          lineItems(first: 10) {
            edges {
              node {
                id
                title
                quantity
                variant {
                  id
                  image {
                    url
                    altText
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export default GET_DRAFT_ORDERS;
