/**
 *
 * mongorest.js
 * phil.estival@free.fr
 * $Date$:2016/09/09 14:01:20 $
 *
 * Mongo REST collection exposition
 * ported to ES6 from dialoguea v1.2
 *
 *
 */

import log from './log'

export class MongoRest {
	constructor(app, options) {
		this.app = app;
		this.options = Object.assign({
			urlPrefix: '/',
			requestPrehandler: function (req, res, next) {
				next();
			}
		}, options || {});
		this.resources = [];
		this.registerRoutes();
	}

	registerRoutes() {
		this.app.all(this.options.urlPrefix + ':resourceName', this.options.requestPrehandler, this.collection());
		this.app.get(this.options.urlPrefix + ':resourceName', this.options.requestPrehandler, this.collectionGet());
		this.app.post(this.options.urlPrefix + ':resourceName', this.options.requestPrehandler, this.collectionPost());

		this.app.all(this.options.urlPrefix + ':resourceName/:id', this.options.requestPrehandler, this.entity());
		this.app.get(this.options.urlPrefix + ':resourceName/:id', this.options.requestPrehandler, this.entityGet());

		// You can POST or PUT to update data
		this.app.post(this.options.urlPrefix + ':resourceName/:id', this.options.requestPrehandler, this.entityPut());
		this.app.put(this.options.urlPrefix + ':resourceName/:id', this.options.requestPrehandler, this.entityPut());

		this.app.delete(this.options.urlPrefix + ':resourceName/:id', this.options.requestPrehandler, this.entityDelete());
	}

	addResource(resource_name, model, options) {
		var resource = {
			resource_name: resource_name,
			model: model,
			//options : options || null
			options: Object.assign({
				requestPrehandler: function (req, res, next) {
					next();
				}
			}, options || {})
		};

		this.resources.push(resource);
	}

	getResource(name) {
		return this.resources.find(function (resource) {
			return resource.resource_name === name;
		})
	}

	renderError(err, redirectUrl, req, res, next) {
		log.dbg(err)
		res.status(400).send(err);
	}

	renderCollection(docs, req, res, next) {
		res.send(docs);
	}

	renderEntity(doc, req, res, next) {
		res.send(doc);
	}

	redirect(address, req, res, next) {
		res.send(address);
	}

	/**
	 * All entities rest functions have to go through this first.
	 */
	collection() {
		return (req, res, next) => {
			req.resource = this.getResource(req.params.resourceName)
			return next()
		}
	}

	/**
	 * Renders a view with the list of all docs.
	 */
	collectionGet() {
		return (req, res, next) => {
			if (!req.resource) {
				return next();
			}

			var self = this, dbQueryOptions = {};
			var hidden_fields = this.generateHiddenFields(req.resource);

			if (req.resource.options.reqPrehandler)
				req.resource.options.reqPrehandler(req, res, getCollection)
			else getCollection();

			function getCollection() {
				//~~ simplified
				// todo : invert. options.query first

				if (req.query)
					dbQueryOptions = req.query
				else {

					if (req.resource.options && req.resource.options.query) {

						if (typeof req.resource.options.query === 'string')
							dbQueryOptions = eval('(' + req.resource.options.query + ')');
						else if (typeof req.resource.options.query !== 'object')
							dbQueryOptions = req.resource.options.query;
					}
				}

				//log.dbg(dbQueryOptions,req.resource,req.resource.model)
				var query = req.resource.model.find(dbQueryOptions).select(hidden_fields);

				if (req.resource.options && req.resource.options.populate) {
					query = query.populate(req.resource.options.populate);
				}

				query.exec((err, docs) => {
					if (err) {
						return self.renderError(err, null, req, res, next);
					} else {
						if (req.resource.model.schema.methods.query) {
							var addon = req.resource.model.schema.methods.query(docs);
							log.dbg("addon?", addon)
						}
						res.send(docs);
					}
					return false;
				});
				return false;
			}
		}
	}

	collectionPost() {
		return (req, res, next) => {

			if (!req.resource) {
				next();
				return;
			}
			if (!req.body) throw new Error('Nothing submitted.');

			var epured_body = this.epureRequest(req, req.resource);
			var doc = new req.resource.model(epured_body);
			var self = this;

			//~~ this goes before !
			if (doc.schema.methods.post)
				doc.schema.methods.post(doc);

			doc.save(function (err) {
				if (err) {
					self.renderError(err, null, req, res, next);
					return;
				}
				res.send(doc);
			});
		}
	}

	/**
	 * Generate an object of fields to not expose
	 */
	generateHiddenFields(resource) {
		var hidden_fields = {};

		if (!resource.options || typeof resource.options.hide == 'undefined')
			return {};

		resource.options.hide.forEach(function (dt) {
			hidden_fields[dt] = false;
		});
		return hidden_fields;
	}

;


	/** Sec issue
	 * Epure incoming data to avoid overwritte and POST request forgery
	 * and disallows writing to read-only fields
	 */
	epureRequest(req, resource) {
		var req_data = req.body;

		if (resource.options === null || (typeof resource.options.hide == 'undefined' && typeof resource.options.readOnly == 'undefined' && typeof resource.options.force == 'undefined'))
			return req_data;

		for (var key in resource.options.force) {
			req_data[key] = eval('(' + resource.options.force[key] + ')');
		}

		var hidden_fields = Array.from(new Set([...resource.options.hide, resource.options.readOnly]));

		Object.keys(req_data).forEach(key=> {
			hidden_fields.forEach(fi => {
				if (fi == key)
					delete req_data[key];
			});
		});

		return req_data;
	}

	/**
	 * Entity request goes there first
	 * It retrieves the resource
	 */
	entity() {
		return (req, res, next) => {
			if (!(req.resource = this.getResource(req.params.resourceName))) {
				next();
				return;
			}

			var hidden_fields = this.generateHiddenFields(req.resource);

			//
			// select({_id : false}) invert the select process (hidde the _id field)
			//
			var query = req.resource.model.findOne({_id: req.params.id}).select(hidden_fields);

			if (req.resource.options && req.resource.options.populate) {
				query = query.populate(req.resource.options.populate);
			}

			query.exec((err, doc) => {
				if (err) {
					return res.status(400).send({
						success: false,
						err: log.dbg('error in query',err) //util.inspect(err)
					});
				}
				else if (doc === null) {
					return res.status(400).send({
						success: false,
						err: 'Record not found'
					});
				}
				req.doc = doc;
				return next();
			})
		}
	}

	/**
	 * Gets a single entity
	 *
	 * @return {Function} The function to use as route
	 */
	entityGet() {
		return (req, res, next) => {
			if (!req.resource) {
				return next();
			}
			if (req.doc.schema.methods.get) {
				var add = req.doc.schema.methods.get(req.doc);
				//log.dbg(add)
			}
			return res.send(req.doc);
		};
	}

	entityPut() {

		return (req, res, next) => {
			if (!req.resource) {
				next()
				return
			}

			if (!req.body) throw new Error('Nothing submitted.')

			var epured_body = this.epureRequest(req, req.resource)

			// Merge

			for (let prop of Object.keys(epured_body)) {
				req.doc[prop] = epured_body[prop];
			}
			/*epured_body.forEach((value, name) => {
			 req.doc[name] = value;
			 })
			 */
			req.doc.save(err => {
				if (err) return res.send({success: false})
				if (req.doc.schema.methods.put) req.doc.schema.methods.put(req.doc)
				return res.send(req.doc);
			})
		}
	}

	entityDelete() {
		return (req, res, next) => {
			if (!req.resource) {
				next();
				return;
			}

			req.doc.remove(function (err) {
				if (err) {
					return res.send({success: false});
				}
				if (req.doc.schema.methods.delete) req.doc.schema.methods.delete(req.doc);
				return res.send({success: true});
			})
		}
	}
}

module.exports = MongoRest
