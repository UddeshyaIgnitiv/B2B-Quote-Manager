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
      const metafieldMissing = !draftOrder?.metafield?.value;
      const draftOrderStatus = draftOrder?.status?.toUpperCase();


      //console.log('metafieldMissing:', metafieldMissing);
      //console.log('draftOrderStatus:', draftOrderStatus);
      //console.log('statusToMetafieldValue keys:', Object.keys(statusToMetafieldValue));
      //console.log('draftOrderStatus in statusToMetafieldValue:', draftOrderStatus in statusToMetafieldValue);

      if (metafieldMissing && draftOrderStatus && draftOrderStatus in statusToMetafieldValue) {
        const metafieldValue = statusToMetafieldValue[draftOrderStatus];

        //console.log("metafieldValue", metafieldValue);

        try {
          const response = await fetchAdminApi(UPDATE_METAFIELD, {
            metafields: [
              {
                ownerId: draftOrder.id,
                namespace: "custom",
                key: "quote_status",
                type: "list.single_line_text_field",
                value: JSON.stringify(metafieldValue),
              },
            ],
          });

          if (response.metafieldsSet.userErrors.length) {
            console.error("User errors:", response.metafieldsSet.userErrors);
          } else {
            console.log("Metafield updated:", response.metafieldsSet.metafields);
          }  

          // Also update the order's local metafield value so it's returned correctly
          draftOrder.metafield = { value: JSON.stringify(metafieldValue) };
        } catch (error) {
          console.warn(`Failed to patch metafield for draft order ${draftOrder.id}:`, error);
        }
      }
    }

    return NextResponse.json({ draftOrders });
  } catch (error) {
    console.error('❌ Error fetching draft orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotes', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
