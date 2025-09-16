import { NextRequest, NextResponse } from 'next/server';
import { fetchAdminApi } from '@/lib/shopify/shopify_service';
import getCompanyLocationsQuery from "@/lib/shopify/queries/getLocations";

export async function GET(request: NextRequest) {
  try {
    const variables = { first: 50 };
    const data = await fetchAdminApi(getCompanyLocationsQuery, variables);
    const locations = data.companyLocations.edges.map((edge: any) => ({
      id: edge.node.id,
      name: edge.node.name,
    }));
    return NextResponse.json({ companyLocations: locations });
  } catch (error) {
    console.error('Error fetching Shopify locations:', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}
