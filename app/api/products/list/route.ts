// app/api/products/list/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchAdminApi } from '@/lib/shopify/shopify_service';
import getProductsQuery from '@/lib/shopify/queries/getproducts';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const searchQuery = searchParams.get('search') || '';
  const limit = Number(searchParams.get('limit')) || 10;
  const companyLocationId = searchParams.get('companyLocationId');

  if (!companyLocationId) {
    return NextResponse.json(
      { error: 'companyLocationId is required for contextual pricing' },
      { status: 400 }
    );
  }

  const variables = {
    query: searchQuery ? `title:*${searchQuery}*` : '',
    first: limit,
    context: {
      companyLocationId: companyLocationId,
    },
  };

  try {
    const data = await fetchAdminApi(getProductsQuery, variables);

    const products = data.products.edges.map((edge: any) => {
      const node = edge.node;
      const variant = node.variants?.edges?.[0]?.node;

      const contextualPriceField = variant?.contextualPricing?.price;
      const price = contextualPriceField
        ? parseFloat(contextualPriceField.amount)
        : parseFloat(variant?.price || '0');

      return {
        id: node.id,
        title: node.title,
        handle: node.handle,
        image: node.featuredImage
          ? { url: node.featuredImage.url, altText: node.featuredImage.altText }
          : undefined,
        price: price,
        variantId: variant?.id ?? null,
        inventoryItemId: variant?.inventoryItem?.id ?? null,
      };
    });

    return NextResponse.json({ products });
  } catch (error: any) {
    console.error('Failed to fetch products', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
