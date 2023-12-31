import { body, query } from "express-validator";
import { paginationQuery } from "./customValidators.js";

export const addOrderValidator = [
	body("product_id").notEmpty().isInt({ min: 1 }).withMessage("product_id must be id"),
	body("count").notEmpty().isInt({ min: 1 }).withMessage("count must be an integer"),
];

export const getAllOrderValidator = [
	query("page").optional().custom(paginationQuery).withMessage("page must be an integer and no less than 1"),
	query("limit").optional().custom(paginationQuery).withMessage("limit must be an integer and no less than 1"),
];

const statusValidator = (input) => input === "packing" || input === "on_the_way" || input === "finished";

export const updateOrderValidator = [
	body("count").optional().isInt({ min: 1 }).withMessage("count must be an integer"),
	body("status").optional().custom(statusValidator).withMessage("status can be 'packing', 'on_the_way' and 'finished'"),
	body("delivery_id").optional().isInt({ min: 1 }).withMessage("delivery_id must be id"),
];
