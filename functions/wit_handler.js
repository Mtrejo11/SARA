const admin = require("firebase-admin");
admin.initializeApp();

function responseFromWit(data) {
  const intent = (data.intents.length > 0 && data.intents[0]) || "__foo__";

  switch (intent.name) {
    case "handleProductInfo":
      return handleProductInfo(data);
    case "products_get":
      return handleGetProducts(data);
    case "handleGreeting":
      return handleGreeting(data);
    case "handleFarewell":
      return handleFarewell(data);
    case "handleAddress":
      return handleAddress(data);
    case "handleInformation":
      return handleContact(data);
    case "handleSchedule":
      return handleSchedule(data);
    default:
      return handleGibberish();
  }
}

function handleGibberish() {
  return Promise.resolve("Sorry, I can't help you with that.");
}

const handleProductInfo = async (data) => {
  const entity_name =
    data.entities["product:product"] && data.entities["product:product"][0];

  let product = entity_name.value ? entity_name.value : " ";
  if (entity_name === null) {
    return handleGibberish();
  }

  try {
    const productResponse = await admin
      .firestore()
      .collection("stores")
      .doc("5eayMsGmQiIpt5AkoO3x")
      .collection("products")
      .get();
    let productDetail = [];
    productResponse.docs.forEach((element) => {
      if (element.data().productName.includes(product)) {
        productDetail.push(element.data());
      }
    });
    const finalProduct = productDetail.length > 0 ? productDetail[0] : null;

    const response = finalProduct
      ? `Product: ${finalProduct.productName}\n Price: $${parseFloat(
          finalProduct.price
        ).toFixed(2)} \nDescription: ${finalProduct.description} \n ${
          finalProduct.payment_url
        }`
      : "No information available for this product";
    return response;
  } catch (error) {
    console.log("ERROR HAPPENED", error);
    handleGibberish();
  }
};

const handleGetProducts = async (data) => {
  try {
    const productResponse = await admin
      .firestore()
      .collection("stores")
      .doc("5eayMsGmQiIpt5AkoO3x")
      .collection("products")
      .get();
    // console.log("PRODUCTS RESPONSE", productResponse);

    const productsDetails = productResponse.docs.reduce((acc, element) => {
      // console.log(JSON.stringify(element.data()));
      const finalProduct = element.data();
      return (
        acc +
        `---------------- \nProduct: ${
          finalProduct.productName
        }\n Price: $${parseFloat(finalProduct.price).toFixed(
          2
        )}\n Description: ${finalProduct.description}\n\n`
      );
    }, "");

    const response =
      productsDetails.length > 0
        ? productsDetails
        : "No products available available.";
    return response;
  } catch (error) {
    console.log("ERROR HAPPENED", error);
    return handleGibberish();
  }
};

const handleGreeting = () => {
  let = p_ans = [
    "Hi there!",
    "Hello, Im Sara",
    "Hello, I'm Sara, Im here to help you",
  ];

  return p_ans[Math.floor(Math.random() * p_ans.length)];
};

const handleFarewell = () => {
  let = p_ans = [
    "Bye bye, see you next time",
    "bye bye, have a nice day",
    "Farewell",
  ];

  return p_ans[Math.floor(Math.random() * p_ans.length)];
};

const handleContact = async (data) => {
  try {
    const productResponse = await admin
      .firestore()
      .collection("stores")
      .doc("5eayMsGmQiIpt5AkoO3x")
      .get();

    return `Phone number: ${productResponse.data().phone}`;
  } catch (error) {
    console.log("ERROR HAPPENED", error);
    return handleGibberish();
  }
};

const handleAddress = async (data) => {
  try {
    const productResponse = await admin
      .firestore()
      .collection("stores")
      .doc("5eayMsGmQiIpt5AkoO3x")
      .get();

    return `You can find us at ${productResponse.data().address}`;
  } catch (error) {
    console.log("ERROR HAPPENED", error);
    return handleGibberish();
  }
};

const handleSchedule = async (data) => {
  try {
    const productResponse = await admin
      .firestore()
      .collection("stores")
      .doc("5eayMsGmQiIpt5AkoO3x")
      .get();
    return `We open at ${productResponse.data().schedule.open} and close at ${
      productResponse.data().schedule.close
    }`;
  } catch (error) {
    console.log("ERROR HAPPENED", error);
    return handleGibberish();
  }
};

exports.responseFromWit = responseFromWit;
