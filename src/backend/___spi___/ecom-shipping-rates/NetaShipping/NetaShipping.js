// @ts-check
import * as ecomShippingRates from "interfaces-ecom-v1-shipping-rates-provider";
import { products } from "wix-stores.v2";

/**
 * This endpoint retrieves applicable shipping rates for a delivery from your app.
 *
 * Wix calls this endpoint when certain actions are performed on the cart and/or checkout. For example, when an item is added to the cart, or the shipping destination is changed.
 *
 * > You cannot try out this endpoint because it has to be implemented by
 * > an app and can have an arbitrary URL. Therefore, ignore the **Authorization**
 * > and **POST** sections below as well as the **Try It Out** button.
 * @param {import('interfaces-ecom-v1-shipping-rates-provider').GetShippingRatesOptions} options
 * @param {import('interfaces-ecom-v1-shipping-rates-provider').Context} context
 * @returns {Promise<import('interfaces-ecom-v1-shipping-rates-provider').GetShippingRatesResponse>}
 */
export const getShippingRates = async (options, context) => {
  const appData = defaultAppData;

  const currency = context.currency;

  if (!currency) {
    throw new Error("Currency is not set");
  }

  const { items: storeProducts } = await products.queryProducts().find();

  console.log("products in store", storeProducts.length);

  // Return the shipping rates.
  return {
    shippingRates: appData.shippingMethods.map(
      ({ code, title, logistics, costs, unitOfMeasure }) => ({
        code,
        title,
        logistics,
        cost: {
          price: `${calculatePrice(options, costs, unitOfMeasure)}`,
          currency,
        },
      })
    ),
  };
};

const defaultAppData = {
  shippingMethods: [
    {
      code: "example-shipping-rate-standard",
      title: "Standard Delivery",
      unitOfMeasure: "NUM_OF_ITEMS",
      logistics: {
        deliveryTime: "3-7 days",
      },
      costs: {
        first: 5,
        second: 2,
        thirdAndUp: 1,
      },
    },
    {
      code: "example-shipping-rate-express",
      title: "Express Delivery",
      unitOfMeasure: "NUM_OF_ITEMS",
      logistics: {
        deliveryTime: "1-2 days",
      },
      costs: {
        first: 10,
        second: 4,
        thirdAndUp: 2,
      },
    },
  ],
};

/**
 *
 * @param {ecomShippingRates.GetShippingRatesOptions} request
 * @param {(typeof defaultAppData)['shippingMethods'][0]['costs']} shippingCosts
 * @param {string} unitOfMeasure
 * @returns
 */
export function calculatePrice(request, shippingCosts, unitOfMeasure) {
  const units =
    request.lineItems?.reduce((acc, lineItem) => {
      if (!request.weightUnit) {
        throw new Error("Weight unit is not set");
      }
      return acc + lineItemUnit(lineItem, unitOfMeasure, request.weightUnit);
    }, 0) ?? 0;

  if (units <= 0) {
    return 0; // Return 0 for an invalid item count.
  }

  // Calculate the total price based on the specified rule.
  const firstItemCost = shippingCosts.first;
  const secondItemCost = shippingCosts.second;
  const additionalItemCost = shippingCosts.thirdAndUp;
  if (units <= 1) {
    return firstItemCost;
  } else if (units <= 2) {
    return firstItemCost + secondItemCost;
  } else {
    return (
      firstItemCost + secondItemCost + Math.ceil(units - 2) * additionalItemCost
    );
  }
}

/**
 *
 * @param {number} amount
 * @param {ecomShippingRates.WeightUnit} weightUnit
 */
const toKilograms = (amount, weightUnit) =>
  amount * (weightUnit === ecomShippingRates.WeightUnit.LB ? 0.453592 : 1);
/**
 *
 * @param {number} amount
 * @param {ecomShippingRates.WeightUnit} weightUnit
 */
const toPounds = (amount, weightUnit) =>
  amount * (weightUnit === ecomShippingRates.WeightUnit.KG ? 2.20462 : 1);

/**
 *
 * @param {NonNullable<ecomShippingRates.GetShippingRatesOptions['lineItems']>[0]} lineItem
 * @param {string} unitOfMeasure
 * @param {ecomShippingRates.WeightUnit} weightUnit
 * @returns
 */
const lineItemUnit = (lineItem, unitOfMeasure, weightUnit) =>
  (lineItem.quantity ?? 1) *
  (unitOfMeasure === "WEIGHT_IN_KG"
    ? toKilograms(lineItem?.physicalProperties?.weight || 1, weightUnit)
    : unitOfMeasure === "WEIGHT_IN_LB"
    ? toPounds(lineItem?.physicalProperties?.weight || 1, weightUnit)
    : 1);
