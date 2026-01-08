import User from "../models/User.js";

export const ClerkWebhooks = async (req, res) => {
  try {
    // Convert raw buffer to string
    const bodyString = req.body.toString("utf8");
    const parsed = JSON.parse(bodyString);

    console.log("Clerk Webhook Incoming (parsed):", parsed);

    const { data, type } = parsed;

    switch (type) {
      case "user.created":
        console.log("User Created Event Data:", data);
        console.log(`✅ New user created: ${data.first_name} ${data.last_name} (${data.email_addresses?.[0]?.email_address})`);
        await User.create({
          _id: data.id,
          email: data.email_addresses?.[0]?.email_address || "",
          name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
          imageUrl: data.image_url || "",
        });
        break;

      case "user.updated":
        console.log("User Updated Event Data:", data);
        await User.findByIdAndUpdate(data.id, {
          email: data.email_addresses?.[0]?.email_address || "",
          name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
          imageUrl: data.image_url || "",
        });
        break;

      case "user.deleted":
        console.log("User Deleted Event Data:", data);
        await User.findByIdAndDelete(data.id);
        break;

      default:
        console.log("Unhandled event:", type);
        break;
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Webhook Error:", err);
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};
