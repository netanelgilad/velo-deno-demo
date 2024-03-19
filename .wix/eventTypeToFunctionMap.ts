export const functionToEventTypeMap = {
  wixStoresCatalog_onProductCreated:
    "com.wix.ecommerce.catalog.api.v1.ProductCreated",
  wixStoresCatalog_onProductChanged:
    "com.wix.ecommerce.catalog.api.v1.ProductChanged",
  wixCrm_onContactCreated: "wix.contacts.v4.contact_created",
};

export const eventTypeToFunctionMap = Object.fromEntries(
  Object.entries(functionToEventTypeMap).map(([key, value]) => [value, key])
);
