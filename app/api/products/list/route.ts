// app/api/products/list/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchAdminApi } from '@/lib/shopify/shopify_service';
import getProductsQuery from '@/lib/shopify/queries/getproducts';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const searchQuery = searchParams.get('search') || '';
  const limit = Number(searchParams.get('limit')) || 10;

  // Prepare variables for your GraphQL query if it supports variables
  const variables = {
    query: searchQuery ? `title:*${searchQuery}*` : '',
    first: limit,
  };

  try {
    const data = await fetchAdminApi(getProductsQuery, variables);
    //console.log("Data Products", data);

    // Transform the data to the shape your frontend expects
    const products = data.products.edges.map((edge: any) => {
      const node = edge.node;
      const variant = node.variants?.edges?.[0]?.node;
      //console.log("Data Products", node);
      return {
        id: node.id,
        title: node.title,
        handle: node.handle,
        image: node.featuredImage
          ? { url: node.featuredImage.url, altText: node.featuredImage.altText }
          : undefined,
        price: parseFloat(node.priceRangeV2.minVariantPrice.amount),
        variantId: variant?.id ?? null,
      };
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Failed to fetch products', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
