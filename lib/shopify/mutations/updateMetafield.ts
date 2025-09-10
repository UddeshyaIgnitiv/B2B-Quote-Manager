export const UPDATE_METAFIELD = `
  mutation UpdateMetafield($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
        key
        namespace
        value
        type
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export default UPDATE_METAFIELD;