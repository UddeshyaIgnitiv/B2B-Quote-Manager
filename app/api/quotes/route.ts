import GET_DRAFT_ORDERS from '@/lib/shopify/queries/getDraftOrders';
import { fetchAdminApi } from '@/lib/shopify/shopify_service';
import UPDATE_METAFIELD from '@/lib/shopify/mutations/updateMetafield';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {

    const response = await fetchAdminApi(GET_DRAFT_ORDERS, { query: '', });
    
    const draftOrders = response?.draftOrders?.edges?.map((edge: any) => edge.node) || [];

    // Define mapping of draftOrder.status to metafield values
    const statusToMetafieldValue: Record<string, string[]> = {
      OPEN: ["submitted"],
      COMPLETED: ["completed"],
      //UNDER_REVIEW: ["under_review"],
      INVOICE_SENT: ["offer_sent"],
      //ACCEPTED: ["accepted"],
      //EXPIRED: ["expired"],
    };

    // Process and patch missing metafields
    for (const draftOrder of draftOrders) {

      const draftOrderStatus = draftOrder?.status?.toUpperCase();
      // Expected metafield value based on current status
      const expectedMetafieldValue = statusToMetafieldValue[draftOrderStatus];
      // Parse the existing metafield value if any
      let currentMetafieldValue;
      try {
        currentMetafieldValue = draftOrder.metafield?.value ? JSON.parse(draftOrder.metafield.value) : null;
      } catch {
        currentMetafieldValue = null;
      }

       // Check if update needed (missing or different)
      const needsUpdate =
        !currentMetafieldValue ||
        JSON.stringify(currentMetafieldValue) !== JSON.stringify(expectedMetafieldValue);

      console.log("draftOrderStatus", draftOrderStatus);
      console.log('metafieldMissing:', needsUpdate);
      console.log('draftOrderStatus:', draftOrderStatus);
      console.log('statusToMetafieldValue keys:', Object.keys(statusToMetafieldValue));
      console.log('draftOrderStatus in statusToMetafieldValue:', draftOrderStatus in statusToMetafieldValue);

      if (draftOrderStatus && draftOrderStatus in statusToMetafieldValue && needsUpdate) {
        try {
          const response = await fetchAdminApi(UPDATE_METAFIELD, {
            metafields: [
              {
                ownerId: draftOrder.id,
                namespace: "custom",
                key: "quote_status",
                type: "list.single_line_text_field",
                value: JSON.stringify(expectedMetafieldValue),
              },
            ],
          });

          if (response.metafieldsSet.userErrors.length) {
            console.error("User errors:", response.metafieldsSet.userErrors);
          } else {
            console.log("Metafield updated:", response.metafieldsSet.metafields);
          }  

          // Update local copy so frontend fetch gets correct valueAlso update the order's local metafield value so it's returned correctly
          draftOrder.metafield = { value: JSON.stringify(expectedMetafieldValue) };
        } catch (error) {
          console.warn(`Failed to patch metafield for quote ${draftOrder.id}:`, error);
        }
      }
    }

    return NextResponse.json({ draftOrders });
  } catch (error) {
    console.error('❌ Error fetching quote:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotes', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
