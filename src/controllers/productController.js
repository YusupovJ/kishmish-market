import apiResponse from "../helpers/apiResponse.js";
import db from "../config/db.config.js";
import Pagination from "../helpers/pagination.js";
import { BadRequest, NotFound } from "../helpers/errors.js";
import checkValidation from "../helpers/checkValidation.js";
import Token from "../helpers/generateTokens.js";

/* 
    addCategories, addEvents, addAttributeValues are functions for
    adding their id into the tables with relation - many to many
*/

const addCategories = async (categories, products_id) => {
	for (const categoryId of categories) {
		const getQuery = "SELECT * FROM categories WHERE id = ?";
		const [[category]] = await db.query(getQuery, categoryId);

		if (!category) {
			throw new BadRequest(`Category with ${categoryId} id not found`);
		}

		const addQuery = "INSERT INTO products_categories SET ?";
		await db.query(addQuery, {
			categories_id: categoryId,
			products_id,
		});
	}
};

const addEvents = async (events, products_id) => {
	for (const eventId of events) {
		const getQuery = "SELECT * FROM events WHERE id = ?";
		const [[event]] = await db.query(getQuery, eventId);

		if (!event) {
			throw new BadRequest(`Event with ${eventId} id not found`);
		}

		const addQuery = "INSERT INTO events_products SET ?";
		await db.query(addQuery, {
			events_id: eventId,
			products_id,
		});
	}
};

const addAttributeValues = async (attributeValues, products_id) => {
	for (const attributeValueId of attributeValues) {
		const getQuery = "SELECT * FROM attribute_values WHERE id = ?";
		const [[attributeValue]] = await db.query(getQuery, attributeValueId);

		if (!attributeValue) {
			throw new BadRequest(`Attribute value with ${attributeValueId} id not found`);
		}

		const addQuery = "INSERT INTO attribute_values_products SET ?";
		await db.query(addQuery, {
			attribute_values_id: attributeValueId,
			products_id,
		});
	}
};

export const add = async (req, res) => {
	try {
		checkValidation(req);

		const { body } = req;
		const newProduct = {
			name_uz: body.name_uz,
			name_ru: body.name_ru,
			desc_uz: body.desc_uz,
			desc_ru: body.desc_ru,
			desc_short_uz: body.desc_short_uz,
			desc_short_ru: body.desc_short_ru,
			count: body.count,
			images: body?.images?.join(",") || null,
			price: body.price,
			discount: body.discount,
		};

		const addQuery = "INSERT INTO products SET ?";
		const [{ insertId }] = await db.query(addQuery, newProduct);

		const { categories, events, attribute_values } = body;

		if (categories) {
			await addCategories(categories, insertId);
		}

		if (events) {
			await addEvents(events, insertId);
		}

		if (attribute_values) {
			await addAttributeValues(attribute_values, insertId);
		}

		apiResponse(res).send("Product created", null, 201);
	} catch (error) {
		apiResponse(res).throw(error);
	}
};

export const getAll = async (req, res) => {
	try {
		checkValidation(req);

		let { page, limit, search, categoryId, attributeValues, eventId, sortBy, orderBy } = req.query;
		const addingElements = [];

		attributeValues = JSON.parse(attributeValues || "[]");
		search = search || "";

		let ifCategory = "";
		let ifEvent = "";
		let ifOrderBy = "";
		let joinAttributeValues = "";
		let checkAttributeValues = "";

		if (categoryId) {
			ifCategory = "AND pc.categories_id = ?";
			addingElements.unshift(+categoryId);
		}

		if (eventId) {
			ifEvent = "AND ep.events_id = ?";
			addingElements.unshift(+eventId);
		}

		if (attributeValues.length > 0) {
			joinAttributeValues = attributeValues
				.map((id) => {
					return `LEFT JOIN attribute_values_products AS avp${id} ON avp${id}.products_id = p.id AND avp${id}.attribute_values_id = ${id}`;
				})
				.join("\n");

			checkAttributeValues = attributeValues
				.map((id) => {
					return `AND avp${id}.products_id IS NOT NULL`;
				})
				.join("\n");
		}

		const orderByQuery = orderBy === "descending" ? "DESC" : "ASC";

		if (sortBy) {
			ifOrderBy = `ORDER BY ${sortBy} ${orderByQuery}`;
		}

		const getTotalItemsQuery = `
                SELECT COUNT(DISTINCT(p.id)) FROM products AS p
                LEFT JOIN products_categories AS pc ON pc.products_id = p.id
                LEFT JOIN categories AS c ON pc.categories_id = c.id
                ${joinAttributeValues}
                WHERE (p.name_uz LIKE '%${search}%'
                OR p.name_ru LIKE '%${search}%'
                OR p.desc_ru LIKE '%${search}%'
                OR p.desc_uz LIKE '%${search}%'
                OR p.desc_short_uz LIKE '%${search}%'
                OR p.desc_short_ru LIKE '%${search}%')
                ${ifCategory}
                ${ifEvent}
                ${checkAttributeValues}
        `;

		const [[{ "COUNT(DISTINCT(p.id))": totalItems }]] = await db.query(getTotalItemsQuery, addingElements);

		const pagination = new Pagination(totalItems, page, limit);

		const getQuery = `
                SELECT DISTINCT p.id, p.name_uz AS product_name_uz, p.name_ru AS product_name_ru, p.desc_ru, p.desc_uz,
                p.desc_short_uz, p.desc_short_ru, p.orders, p.views, r.rating,
                p.count, p.images, p.price, p.discount, p.created_at, p.updated_at, 
                c.name_uz AS category_name_uz, c.name_ru AS category_name_ru
                FROM products AS p
                LEFT JOIN products_categories AS pc ON pc.products_id = p.id
                LEFT JOIN categories AS c ON pc.categories_id = c.id
                LEFT JOIN reviews AS r ON r.product_id = p.id
                ${joinAttributeValues}
                WHERE (p.name_uz LIKE '%${search}%'
                OR p.name_ru LIKE '%${search}%'
                OR p.desc_ru LIKE '%${search}%'
                OR p.desc_uz LIKE '%${search}%'
                OR p.desc_short_uz LIKE '%${search}%'
                OR p.desc_short_ru LIKE '%${search}%')
                ${ifCategory}
                ${ifEvent}
                ${checkAttributeValues}
                ${ifOrderBy}
                LIMIT ? OFFSET ?
        `;

		const [response] = await db.query(getQuery, [...addingElements, pagination.limit, pagination.offset]);

		// replace "imageUrl,imageUrl" on ["imageUrl", "imageUrl"]
		const products = response.map((product) => {
			if (product.images) {
				return {
					...product,
					images: product.images.split(","),
				};
			}

			return product;
		});

		apiResponse(res).send(products, pagination);
	} catch (error) {
		console.log(error);
		apiResponse(res).throw(error);
	}
};

export const getOne = async (req, res) => {
	try {
		checkValidation(req);

		const { id } = req.params;

		const getQuery = "SELECT * FROM products WHERE id = ?";
		const [[product]] = await db.query(getQuery, id);

		const getAttrQuery = `
            SELECT a.id, a.name_uz, a.name_ru, av.value_uz, av.value_ru 
            FROM attribute_values_products AS avp
            JOIN attribute_values AS av ON av.id = avp.attribute_values_id 
            JOIN attributes AS a ON a.id = av.attribute_id
            WHERE avp.products_id = ?;
        `;
		const [attributeValues] = await db.query(getAttrQuery, id);

		const getRatingQuery = "SELECT AVG(rating) FROM reviews WHERE product_id = ?";
		const [[{ "AVG(rating)": rating }]] = await db.query(getRatingQuery, id);

		product.views += 1;
		product.rating = rating || 0;
		product.attributeValues = attributeValues;
		product.isFav = false;
		product.images = product?.images?.split(",") || [];

		const updateViewsQuery = "UPDATE products SET views = ? WHERE id = ?";
		await db.query(updateViewsQuery, [product.views, id]);

		const token = req.headers?.authorization?.split(" ")[1];

		if (token) {
			const { id: userId } = Token.verifyAccessToken(token);

			const getQuery = "SELECT * FROM users_products WHERE products_id = ? AND users_id = ?";
			const [[isFav]] = await db.query(getQuery, [id, userId]);

			product.isFav = Boolean(isFav);
		}

		apiResponse(res).send(product);
	} catch (error) {
		apiResponse(res).throw(error);
	}
};

export const update = async (req, res) => {
	try {
		checkValidation(req);

		const { id } = req.params;
		const getQuery = "SELECT * FROM products WHERE id = ?";
		const [[product]] = await db.query(getQuery, id);

		if (!product) {
			throw new NotFound("Product not found");
		}

		const { events, categories, attribute_values, ...updatedProduct } = { ...req.body, updated_at: new Date() };

		const updateQuery = "UPDATE products SET ? WHERE id = ?";
		await db.query(updateQuery, [updatedProduct, +id]);

		if (categories) {
			await db.query("DELETE FROM products_categories WHERE products_id = ?", id);
			await addCategories(categories, id);
		}

		if (events) {
			await db.query("DELETE FROM events_products WHERE products_id = ?", id);
			await addEvents(events, id);
		}

		if (attribute_values) {
			await db.query("DELETE FROM attribute_values_products WHERE products_id = ?", id);
			await addAttributeValues(attribute_values, id);
		}

		apiResponse(res).send("Product updated", null, 201);
	} catch (error) {
		apiResponse(res).throw(error);
	}
};

export const remove = async (req, res) => {
	try {
		checkValidation(req);

		const { id } = req.params;

		const getQuery = "SELECT * FROM products WHERE id = ?";
		const [[product]] = await db.query(getQuery, id);

		if (!product) {
			throw new NotFound("Product not found");
		}

		const delQuery = "DELETE FROM products WHERE id = ?";
		await db.query(delQuery, id);

		apiResponse(res).send("Product removed");
	} catch (error) {
		apiResponse(res).throw(error);
	}
};
