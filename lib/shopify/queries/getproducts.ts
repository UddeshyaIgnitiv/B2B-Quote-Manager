// lib/shopify/queries/getproducts.ts
const getProductsQuery = `
  query getProducts($query: String, $first: Int!, $context: ContextualPricingContext!) {
    products(first: $first, query: $query) {
      edges {
        node {
          id
          title
          handle
          featuredImage {
            url
            altText
          }
          priceRangeV2 {
            minVariantPrice {
                amount
                currencyCode
            }
          }
          variants(first: 1) {
            edges {
              node {
                id
                price
                inventoryItem {
                  id
                }
                contextualPricing(context: $context) {
                  price {
                    amount
                    currencyCode
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


export default getProductsQuery;
