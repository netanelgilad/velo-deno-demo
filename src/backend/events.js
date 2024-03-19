import { products } from "wix-stores.v2";

export async function wixCrm_onContactCreated(event) {
  //   const eventId = event.metadata.id;
  //   const entityId = event.entity._id;
  console.log(event);
  const { items: storeProducts } = await products.queryProducts().find();

  console.log("products in store", storeProducts.length);
}
