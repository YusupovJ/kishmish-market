import express from "express";
import env from "./config/env.config.js";
import authRoute from "./routes/authRoute.js";
import productRoute from "./routes/productRoute.js";
import userRoute from "./routes/userRoute.js";
import categoryRoute from "./routes/categoryRoute.js";
import eventRoute from "./routes/eventRoute.js";
import favouriteRoute from "./routes/favouriteRoute.js";
import cartRoute from "./routes/cartRoute.js";
import addressRoute from "./routes/addressRoute.js";
import reviewRoute from "./routes/reviewRoute.js";
import orderRoute from "./routes/orderRoute.js";
import deliveryRoute from "./routes/deliveryRoute.js";
import attributeRoute from "./routes/attributeRoute.js";

const app = express();
const port = env.PORT;

app.use(express.json());
app.use("/auth", authRoute);
app.use("/products", productRoute);
app.use("/users", userRoute);
app.use("/categories", categoryRoute);
app.use("/events", eventRoute);
app.use("/favourites", favouriteRoute);
app.use("/cart", cartRoute);
app.use("/address", addressRoute);
app.use("/reviews", reviewRoute);
app.use("/orders", orderRoute);
app.use("/delivery", deliveryRoute);
app.use("/attributes", attributeRoute);

app.listen(port, () => {
	try {
		console.log(`Server was started on port ${port}`);
	} catch (error) {
		console.log(error);
	}
});
