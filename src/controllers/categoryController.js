import apiResponse from "../helpers/apiResponse.js";
import db from "../config/db.config.js";
import Pagination from "../helpers/pagination.js";
import { BadRequest, NotFound } from "../helpers/errors.js";

const add = async (req, res) => {
	try {
		const { body } = req;
		const newCategory = {
			name_uz: body.name_uz,
			name_ru: body.name_ru,
			desc_uz: body.desc_uz,
			desc_ru: body.desc_ru,
			images: body.images,
			parent_id: body.parent_id,
		};

		const [{ insertId }] = await db.query("INSERT INTO categories SET ?", newCategory);
		const [[addedCategory]] = await db.query("SELECT * FROM categories WHERE id = ?", insertId);

		const { attributes } = body;

		if (attributes) {
			for (const attributeId of attributes) {
				const [[attribute]] = await db.query(
					"SELECT * FROM attributes WHERE id = ?",
					attributeId
				);

				if (!attribute) {
					throw new BadRequest(`There are no attributes with ${attributeId} id`);
				}

				await db.query("INSERT INTO attributes_categories SET ?", {
					attributes_id: attributeId,
					products_id: insertId,
				});
			}
		}

		apiResponse(res).send(addedCategory, null, 201);
	} catch (error) {
		apiResponse(res).throw(error);
	}
};

const getAll = async (req, res) => {
	try {
		const [[{ "COUNT(id)": totalItems }]] = await db.query(
			"SELECT COUNT(id) FROM categories WHERE parent_id IS NULL"
		);

		const { page, limit } = req.query;
		const pagination = new Pagination(totalItems, page, limit);

		const [
			categories,
		] = await db.query("SELECT * FROM categories WHERE parent_id IS NULL LIMIT ? OFFSET ?", [
			pagination.limit,
			pagination.offset,
		]);

		apiResponse(res).send(categories, pagination);
	} catch (error) {
		apiResponse(res).throw(error);
	}
};

const update = async (req, res) => {
	try {
		const { id } = req.params;
		const [[category]] = await db.query("SELECT * FROM categories WHERE id = ?", id);

		if (!category) {
			throw new NotFound("This category does not exist");
		}

		const updatedCategory = { ...req.body, updated_at: new Date() };

		await db.query("UPDATE categories SET ? WHERE id = ?", [updatedCategory, id]);

		apiResponse(res).send("Category was succefully updated", null, 201);
	} catch (error) {
		apiResponse(res).throw(error);
	}
};

const remove = async (req, res) => {
	try {
		const { id } = req.params;
		const [[category]] = await db.query("SELECT * FROM categories WHERE id = ?", id);

		if (!category) {
			throw new NotFound("This category does not exist");
		}

		await db.query("DELETE FROM categories WHERE id = ?", id);

		apiResponse(res).send("Category was succefully deleted");
	} catch (error) {
		apiResponse(res).throw(error);
	}
};

export default {
	add,
	getAll,
	update,
	remove,
};
