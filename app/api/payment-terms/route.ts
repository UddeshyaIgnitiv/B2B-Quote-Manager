import { NextRequest, NextResponse } from 'next/server';
import { fetchAdminApi } from '@/lib/shopify/shopify_service';

// 🧾 GraphQL: Fetch available payment terms templates
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

// 📦 GraphQL: Fetch current draft order payment terms
const GET_DRAFT_ORDER_QUERY = `
  query getDraftOrder($id: ID!) {
    draftOrder(id: $id) {
      id
      paymentTerms {
        id
        dueInDays
        translatedName
        paymentSchedules(first: 1) {
          edges {
            node {
              issuedAt
              dueAt
            }
          }
        }
      }
    }
  }
`;

// ✍️ GraphQL: Update draft order with selected payment terms and issue date
const MUTATION_SET_PAYMENT_TERMS = `
  mutation draftOrderUpdate($id: ID!, $input: DraftOrderInput!) {
    draftOrderUpdate(id: $id, input: $input) {
      draftOrder {
        id
        paymentTerms {
          id
          translatedName
          dueInDays
          paymentSchedules(first: 10) {
            edges {
              node {
                issuedAt
                dueAt
              }
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// 🔍 GET /api/payment-terms?draftOrderId=...
export async function GET(req: NextRequest) {
  const draftOrderId = req.nextUrl.searchParams.get('draftOrderId');

  if (!draftOrderId) {
    return NextResponse.json({ error: 'Missing draftOrderId' }, { status: 400 });
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
    console.error('Error fetching payment terms:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 📬 POST /api/payment-terms
export async function POST(req: NextRequest) {
  try {
    const { draftOrderId, templateId, issueDate } = await req.json();

    if (!draftOrderId || !templateId || !issueDate) {
      return NextResponse.json(
        { error: 'Missing draftOrderId, templateId, or issueDate' },
        { status: 400 }
      );
    }

    const issuedAtISO = new Date(issueDate).toISOString();

    const variables = {
      id: draftOrderId,
      input: {
        paymentTerms: {
          paymentTermsTemplateId: templateId,
          paymentSchedules: [
            {
              issuedAt: issuedAtISO,
            },
          ],
        },
      },
    };

    const result = await fetchAdminApi(MUTATION_SET_PAYMENT_TERMS, variables);

    if (result.draftOrderUpdate?.userErrors?.length) {
      const [firstError] = result.draftOrderUpdate.userErrors;
      return NextResponse.json({ error: firstError.message }, { status: 400 });
    }

    const updatedPaymentTerms = result.draftOrderUpdate.draftOrder.paymentTerms;

    return NextResponse.json({
      success: true,
      paymentTerms: updatedPaymentTerms,
    });
  } catch (err: any) {
    console.error('Error updating payment terms:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
