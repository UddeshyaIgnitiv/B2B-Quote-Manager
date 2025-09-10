const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN!;
const SHOPIFY_ADMIN_API_URL = process.env.SHOPIFY_ADMIN_API_URL!;
const SHOPIFY_STOREFRONT_API_URL = process.env.SHOPIFY_STOREFRONT_API_URL!;
const SHOPIFY_STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!;

// Admin API fetch - you already have this:
export async function fetchAdminApi(query: any, variables: Record<string, any>) {
  const queryString = typeof query === 'string' ? query : query.loc?.source.body;

  const response = await fetch(SHOPIFY_ADMIN_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
    },
    body: JSON.stringify({ query: queryString, variables }),
  });

  const json = await response.json();
  if (json.errors || json.data?.userErrors?.length > 0) {
    throw new Error(JSON.stringify(json.errors || json.data.userErrors));
  }

  return json.data;
}

// Storefront API fetch
export async function fetchStorefrontApi(query: string, variables?: Record<string, any>, customerAccessToken?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
  };

  if (customerAccessToken) {
    headers['Authorization'] = `Bearer ${customerAccessToken}`;
  }

  const response = await fetch(SHOPIFY_STOREFRONT_API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  const json = await response.json();

  if (json.errors) {
    console.error("Storefront API errors:", json.errors);
    throw new Error('Storefront API request failed');
  }

  return json.data;
}
