import { Router } from "express";
import { add, getAll, getOne, remove, update } from "../controllers/reviewController.js";
import { isId } from "../validators/customValidators.js";
import authGuard from "../middlewares/authGuard.js";
import { addReviewValidator, getAllReviewValidator, updateReviewValidator } from "../validators/reviewValidator.js";

const reviewRoute = Router();

reviewRoute.post("/", authGuard, ...addReviewValidator, add);
reviewRoute.get("/all/:id", ...getAllReviewValidator, isId, getAll);
reviewRoute.get("/:id", isId, getOne);
reviewRoute.patch("/:id", authGuard, ...updateReviewValidator, isId, update);
reviewRoute.delete("/:id", authGuard, isId, remove);

export default reviewRoute;
