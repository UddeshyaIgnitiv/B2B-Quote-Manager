// lib/shopify/queries/getCompanyLocations.ts

const getCompanyLocationsQuery = `
query GetCompanyLocations($first: Int!) {
  companyLocations(first: $first) {
    edges {
      node {
        id
        name
      }
    }
  }
}
`;

export default getCompanyLocationsQuery;
