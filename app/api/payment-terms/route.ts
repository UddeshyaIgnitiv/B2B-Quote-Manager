// app/api/payment-terms/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchAdminApi } from '@/lib/shopify/shopify_service';

const GET_TEMPLATES_QUERY = `
  {
    paymentTermsTemplates {
      id
      name
      translatedName
      dueInDays
    }
  }
`;

const GET_DRAFT_ORDER_QUERY = `
  query getDraftOrder($id: ID!) {
    draftOrder(id: $id) {
      id
      paymentTerms {
        id
        dueInDays
        translatedName
      }
    }
  }
`;

const MUTATION_SET_PAYMENT_TERMS = `
  mutation draftOrderUpdate($id: ID!, $input: DraftOrderInput!) {
    draftOrderUpdate(id: $id, input: $input) {
      draftOrder {
        id
        paymentTerms {
          id
          translatedName
          dueInDays
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export async function GET(req: NextRequest) {
  const draftOrderId = req.nextUrl.searchParams.get('draftOrderId');
  if (!draftOrderId) {
    return NextResponse.json({ error: 'draftOrderId is required' }, { status: 400 });
  }

  try {
    const [templatesData, draftOrderData] = await Promise.all([
      fetchAdminApi(GET_TEMPLATES_QUERY, {}),
      fetchAdminApi(GET_DRAFT_ORDER_QUERY, { id: draftOrderId }),
    ]);

    const templates = templatesData.paymentTermsTemplates || [];
    const paymentTerms = draftOrderData.draftOrder?.paymentTerms || null;

    return NextResponse.json({ templates, paymentTerms });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


export async function POST(req: NextRequest) {
  try {
    const { draftOrderId, templateId } = await req.json();

    if (!draftOrderId || !templateId) {
      return NextResponse.json({ error: 'Missing draftOrderId or templateId' }, { status: 400 });
    }

    const variables = {
      id: draftOrderId,
      input: {
        paymentTerms: {
          paymentTermsTemplateId: templateId,
        },
      },
    };

    const result = await fetchAdminApi(MUTATION_SET_PAYMENT_TERMS, variables);

    if (result.draftOrderUpdate?.userErrors?.length) {
      return NextResponse.json({ error: result.draftOrderUpdate.userErrors[0].message }, { status: 400 });
    }

    return NextResponse.json({ success: true, paymentTerms: result.draftOrderUpdate.draftOrder.paymentTerms });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
