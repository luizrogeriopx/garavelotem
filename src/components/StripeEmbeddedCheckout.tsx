import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createCheckoutSession } from "@/utils/payments.functions";

interface Props {
  priceId: string;
  businessId: string;
  customerEmail?: string;
  returnUrl?: string;
}

export function StripeEmbeddedCheckout({ priceId, businessId, customerEmail, returnUrl }: Props) {
  const fetchClientSecret = async (): Promise<string> => {
    const cs = await createCheckoutSession({
      data: {
        priceId,
        businessId,
        customerEmail,
        returnUrl: returnUrl || window.location.href,
        environment: getStripeEnvironment(),
      },
    });
    if (!cs) throw new Error("No client secret returned");
    return cs;
  };

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
