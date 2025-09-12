import GET_DRAFT_ORDER from '@/lib/shopify/queries/getDraftOrder';
import UPDATE_DRAFT_ORDER from '@/lib/shopify/mutations/updateDraftOrder';
import DRAFT_ORDER_INVOICE_SEND from '@/lib/shopify/mutations/draftOrderInvoiceSend';
import DRAFT_ORDER_COMPLETE  from '@/lib/shopify/mutations/draftOrderComplete';
import { fetchAdminApi } from '@/lib/shopify/shopify_service';
import { NextRequest, NextResponse } from 'next/server';

// -------------------- GET --------------------

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { params } = context;
  const resolved = await params;
  const draftOrderId = decodeURIComponent(resolved.id);

  try {
    const data = await fetchAdminApi(GET_DRAFT_ORDER, { id: draftOrderId });
    const draftOrder = data?.draftOrder;

    //console.log('Raw draftOrder from Shopify:', draftOrder);

    //console.log('Raw appliedDiscount from Shopify:', draftOrder.appliedDiscount);

    if (!draftOrder) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    const entity = draftOrder.purchasingEntity;
    //console.log('Raw draftOrder from entity:', entity);
    let companyName = "";

    if (entity?.__typename === "PurchasingCompany") {
      companyName = entity.company?.name || "";
    } else if (entity?.__typename === "Customer") {
      companyName = entity.defaultAddress?.company || "";
    }

    const lineItems = draftOrder.lineItems.edges.map(({ node }: any) => ({
      id: node.id,
      title: node.title,
      quantity: node.quantity,
      price: parseFloat(node.originalUnitPrice),
      image: node.image || null,
      variantId: node.variant?.id || null,
      isCustom: !node.variant, // flag for frontend
      requiresShipping: node.requiresShipping ?? false,
      taxable: node.taxable ?? false,
    }));

    const quote = {
      id: draftOrder.id,
      name: draftOrder.name,
      status: draftOrder.status,
      createdAt: draftOrder.createdAt,
      customer: draftOrder.customer,
      shippingAddress: draftOrder.shippingAddress || null,
      billingAddress: draftOrder.billingAddress || null,
      lineItems,
      poNumber: draftOrder.poNumber,
      subtotalPrice: draftOrder.subtotalPrice || null,
      shippingPrice: draftOrder.totalShippingPriceSet?.shopMoney?.amount || 0,
      taxAmount: draftOrder.totalTaxSet?.shopMoney?.amount || 0,
      totalPrice: draftOrder.totalPrice || null,
      // Optional fields
      companyName: companyName || '',
      paymentTerms: draftOrder.paymentTerms ?? null,
      locationName: draftOrder.purchasingEntity?.location?.name || '',
      totalDiscounts: draftOrder.totalDiscountsSet?.shopMoney?.amount || 0,
      appliedDiscount: draftOrder.appliedDiscount
        ? {
            description: draftOrder.appliedDiscount.description,
            valueType: draftOrder.appliedDiscount.valueType,
            value: parseFloat(draftOrder.appliedDiscount.value ?? '0'),
          }
        : null,
      shippingLine: draftOrder.shippingLine || null,
      taxLines: draftOrder.taxLines || [],
      tags: draftOrder.tags || [],
      note2: draftOrder.note2 || ""
    };
    //console.log('Final quote returned:', quote);

    return NextResponse.json({ quote });
  } catch (error) {
    console.error('Error fetching quote:', error);
    return NextResponse.json({ error: 'Failed to fetch quote details' }, { status: 500 });
  }
}

// -------------------- POST --------------------
// Keep this code for Further Use
// export async function POST(
//   request: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     // 1. Decode Draft Order GID
//     const draftOrderGID = decodeURIComponent(params.id);
//     console.log('[Invoice API] Draft Order GID:', draftOrderGID);

//     // 2. Get email payload from request body
//     const { emailPayload } = await request.json();
//     console.log('[Invoice API] Email Payload:', emailPayload);

//     // 3. Prepare sanitized email input
//     const emailInput = {
//       to: emailPayload.to,
//       from: emailPayload.from,
//       subject: emailPayload.subject,
//       customMessage: emailPayload.customMessage,
//       cc: emailPayload.cc,
//       bcc: emailPayload.bcc,
//     };

//     console.log('[Invoice API] Email Input to Shopify:', emailInput);

//     // 4. Send the invoice
//     const result = await fetchAdminApi(DRAFT_ORDER_INVOICE_SEND, {
//       id: draftOrderGID,
//       email: emailInput,
//     });

//     console.log('[Invoice API] Response from Shopify:', result);

//     const userErrors = result.draftOrderInvoiceSend?.userErrors || [];

//     if (userErrors.length > 0) {
//       console.error('[Invoice API] User Errors:', userErrors);
//       return new Response(JSON.stringify({ errors: userErrors }), { status: 400 });
//     }

//     const invoiceUrl = result.draftOrderInvoiceSend?.draftOrder?.invoiceUrl;

//     // 5. ✅ Immediately complete the draft order to mark it as a real order
//     const completeResult = await fetchAdminApi(DRAFT_ORDER_COMPLETE, {
//       id: draftOrderGID,
//     });

//     console.log('[Invoice API] Draft Order Complete Response:', completeResult);

//     const completeErrors = completeResult.draftOrderComplete?.userErrors || [];

//     if (completeErrors.length > 0) {
//       console.error('[Invoice API] Complete Errors:', completeErrors);
//       return new Response(JSON.stringify({ errors: completeErrors }), { status: 400 });
//     }

//     // 6. Return success
//     return new Response(
//       JSON.stringify({
//         success: true,
//         invoiceUrl,
//         orderId: completeResult.draftOrderComplete.draftOrder.id,
//       }),
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error('[Invoice API] Unexpected Error:', error);
//     return new Response(
//       JSON.stringify({ error: 'Failed to send offer or complete order' }),
//       { status: 500 }
//     );
//   }
// }


export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const resolvedParams = await params;
    const draftOrderGID = decodeURIComponent(resolvedParams.id);
    //console.log('[Invoice API] Draft Order GID:', draftOrderGID);

    const { emailPayload } = await request.json();
    //console.log('[Invoice API] Email Payload:', emailPayload);

    const emailInput = {
      to: emailPayload.to,
      from: emailPayload.from,
      cc: emailPayload.cc,
      bcc: emailPayload.bcc,
      subject: emailPayload.subject,
      customMessage: emailPayload.customMessage,
    };

    //console.log('[Invoice API] Email Input to Shopify:', emailInput);

    const result = await fetchAdminApi(DRAFT_ORDER_INVOICE_SEND, {
      id: draftOrderGID,
      email: emailInput,
    });

    //console.log('[Invoice API] Response from Shopify:', result);

    const errors = result?.draftOrderInvoiceSend?.userErrors || [];

    if (errors.length > 0) {
      console.error('[Invoice API] User Errors:', errors);
      return new Response(JSON.stringify({ errors }), { status: 400 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error: any) {
    console.error('[Invoice API] Unexpected Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send offer' }),
      { status: 500 }
    );
  }
}







// -------------------- PUT --------------------

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { params } = context;
  const resolved = await params;
  const draftOrderId = resolved.id;

  try {
    const body = await request.json();

    //console.log('PUT /api/quotes/[id] - Incoming body:', body);

    const {
      lineItems, 
      appliedDiscount,
      shippingLine,
      taxLines,
    } = body;

    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      return NextResponse.json({ error: 'Invalid or empty lineItems array' }, { status: 400 });
    }

    // Validate and build lineItems input for Shopify mutation
    const lineItemsInput = lineItems.reduce((acc: any[], item: any) => {
      if (item.variantId) {
        acc.push({
          variantId: item.variantId,
          quantity: item.quantity,
          requiresShipping: item.requiresShipping ?? false,
          taxable: item.taxable ?? false,
        });
      } else if (item.title && typeof item.price === 'number') {
        acc.push({
          title: item.title,
          quantity: item.quantity,
          originalUnitPriceWithCurrency: {
            amount: item.price.toFixed(2),
            currencyCode: "USD",
          },
          requiresShipping: item.requiresShipping ?? false,
          taxable: item.taxable ?? false,
        });
      }
      return acc;
    }, []);

    if (lineItemsInput.length === 0) {
      return NextResponse.json({ error: 'At least one valid line item is required' }, { status: 400 });
    }

    // Build input object for mutation
    const input: any = {
      lineItems: lineItemsInput,
    };

    //console.log('Prepared input for Shopify mutation:', input);

    // Applied Discount (flattened as per Shopify requirements)
    if (appliedDiscount && appliedDiscount.value != null && appliedDiscount.valueType) {
      input.appliedDiscount = {
        description: appliedDiscount.description || '',
        valueType: appliedDiscount.valueType,
        value: appliedDiscount.value,
      };
      //console.log("Sending Discount to Shopify:", input.appliedDiscount);
    }

    // Shipping line
    if (shippingLine && typeof shippingLine.price === 'number') {
      input.shippingLine = {
        title: shippingLine.title || "Shipping",
        price: shippingLine.price,
      };
       //console.log("Sending Shipping to Shopify:", input.shippingLine);
    }

    // Tax lines
    if (Array.isArray(taxLines) && taxLines.length > 0) {
      input.taxLines = taxLines.map((tax: any) => ({
        title: tax.title || "Tax",
        price: tax.price ?? 0,
        rate: tax.rate ?? undefined,
      }));
    }

    // Call Shopify API
    const result = await fetchAdminApi(UPDATE_DRAFT_ORDER, {
      id: draftOrderId,
      input,
    });

    //console.log('Shopify draftOrderUpdate response:', result);

    if (result.draftOrderUpdate.userErrors && result.draftOrderUpdate.userErrors.length > 0) {
      return NextResponse.json({ errors: result.draftOrderUpdate.userErrors }, { status: 400 });
    }

    return NextResponse.json({ success: true, updated: result.draftOrderUpdate.draftOrder });

  } catch (error: any) {
    console.error('Error updating quote:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
