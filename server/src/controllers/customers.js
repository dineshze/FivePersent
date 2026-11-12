import Customer from "../models/Customer.js";
import {
  asyncHandler,
  validEmail,
  validObjectId,
  validPhone,
} from "../utils/http.js";

export const listCustomers = asyncHandler(async (request, response) => {
  const customers = await Customer.find({ userId: request.userId })
    .sort({ createdAt: -1 })
    .limit(1000);
  return response.json(customers);
});

export const updateCustomer = asyncHandler(async (request, response) => {
  if (!validObjectId(request.params.id))
    return response.status(400).json({ message: "Invalid customer ID." });
  const { name, phone, email = "", address } = request.body || {};
  if (
    typeof name !== "string" ||
    name.trim().length < 2 ||
    name.trim().length > 120
  ) {
    return response
      .status(400)
      .json({ message: "Enter a valid customer name." });
  }
  if (!validPhone(phone))
    return response
      .status(400)
      .json({ message: "Enter a valid phone number." });
  if (email && !validEmail(email))
    return response
      .status(400)
      .json({ message: "Enter a valid email address." });
  if (typeof address !== "string" || !address.trim() || address.length > 1000) {
    return response
      .status(400)
      .json({ message: "Enter a valid customer address." });
  }
  const customer = await Customer.findOneAndUpdate(
    { _id: request.params.id, userId: request.userId },
    {
      $set: {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        address: address.trim(),
      },
    },
    { new: true, runValidators: true },
  );
  if (!customer)
    return response.status(404).json({ message: "Customer not found." });
  return response.json(customer);
});
