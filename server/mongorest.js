/**
 * Date: <2014-12-01 16:29:44>
 * DialogueA
 * philippe.estival@enov-formation.com
 *
 * server/mongorest.js
 * Mongo REST collection exposition
 *
 */


var log = require('./log')
var _ = require('underscore');
var util = require('util');

var MongoRest = function(app, options) {
	this.app = app;
	this.options = _.extend({
		urlPrefix: '/',
		requestPrehandler: function(req, res, next) {
			next();
		}
	}, options || {});
	this.resources = [ ];
	this.registerRoutes();

};

/**
 * Exporting the Class
 */
module.exports = exports = MongoRest;

/**
 * Registers all REST routes with the provided `app` object.
 */
MongoRest.prototype.registerRoutes = function() {
	// last callback bound with req,res,next (see _.bind)
	this.app.all(this.options.urlPrefix + ':resourceName',  this.options.requestPrehandler, this.collection()); // retrieve the resource, no prehandler
	this.app.get(this.options.urlPrefix + ':resourceName',  this.collectionGet());
	this.app.post(this.options.urlPrefix + ':resourceName', this.collectionPost());

	this.app.all(this.options.urlPrefix + ':resourceName/:id', this.options.requestPrehandler, this.entity());
	this.app.get(this.options.urlPrefix + ':resourceName/:id', this.entityGet());
	// You can POST or PUT to update data
	this.app.post(this.options.urlPrefix + ':resourceName/:id',   this.entityPut());
	this.app.put(this.options.urlPrefix + ':resourceName/:id',    this.entityPut());
	this.app.delete(this.options.urlPrefix + ':resourceName/:id', this.entityDelete());
};

MongoRest.prototype.addResource = function(resource_name, model, options) {
	var resource = {
		resource_name: resource_name,
		model: model,
		//options : options || null
		options : _.extend({
			putPrehandler: function(req, res, next) {
				next();
			}
		}, options || {})
	};

	this.resources.push(resource);
};

MongoRest.prototype.getResource = function(name) {
	return _.find(this.resources, function(resource) {
		return resource.resource_name === name;
	});
};

MongoRest.prototype.renderError = function (err, redirectUrl, req, res, next) {
	log.dbg("Error",err)
	res.status(400).send(err);
};

MongoRest.prototype.renderCollection = function(docs, req, res, next) {
	res.send(docs);
};

MongoRest.prototype.renderEntity = function (doc, req, res, next) {
	res.send(doc);
};

MongoRest.prototype.redirect = function (address, req, res, next) {
	res.send(address);
};

/**
 * All entities rest functions have to go through this first.
 */
MongoRest.prototype.collection = function() {
	return _.bind(function(req, res, next) { // http://underscorejs.org/#bind
		req.resource = this.getResource(req.params.resourceName);
		return next();
	}, this);
};

/**
 * Renders a view with the list of all docs.
 */
MongoRest.prototype.collectionGet = function() {

	return _.bind(function(req, res, next) {

		if (!req.resource) {
			return next();
		}

		var self = this, dbQueryOptions = req.query
		var hidden_fields = this.generateHiddenFields(req.resource);

		//log.dbgAr(hidden_fields)
		//log.dbgAr(dbQueryOptions)


		/*
			todo: examinate for query options
		 */
		if (req.resource.options && req.resource.options.query) {
			log.dbgAr("req.resource.options.query = ",req.resource.options.query)
			if (typeof req.resource.options.query === 'string')
				dbQueryOptions = eval( '(' + req.resource.options.query + ')');
			else if (typeof req.resource.options.query !== 'object')
				dbQueryOptions = req.resource.options.query;

			if(dbQueryOptions) log.dbgAr(dbQueryOptions)
		}
			/*
		 if (typeof req.resource.options.query === 'string')
		 dbQueryOptions = eval( '(' + req.resource.options.query + ')');
		 else if (typeof req.resource.options.query !== 'object')
		 dbQueryOptions = req.resource.options.query;
		 }*/


		var query = req.resource.model.find(dbQueryOptions,hidden_fields)//.select(hidden_fields);

		if (req.resource.options && req.resource.options.populate) {
			query = query.populate(req.resource.options.populate);
		}

		query.exec(function(err, docs) {
			//log.dbgAr('all docs in collection ? ',req.resource.resource_name)
			if (err) {
				return self.renderError(err, null, req, res, next);
			} else {

				if(req.resource.model.schema.methods.query) {
					var addon=req.resource.model.schema.methods.query(docs);
					//log.dbg("addon?",addon)
				}
				//log.dbg(docs)
				res.send(docs);
			}
			return false;
		});
		return false;
	}, this);
};

MongoRest.prototype.collectionPost = function()
{
	return _.bind(function(req, res, next) {

		if (!req.resource) { next(); return; }
		if (!req.body) throw new Error('Nothing submitted.');

		var epured_body = this.epureRequest(req, req.resource);
		var doc = new req.resource.model(epured_body);
		var self = this;

		if (doc.schema.methods.post)
			doc.schema.methods.post(doc);

		// could need a workaround in case there is already a pre-save middleware registred (by a plugin for instance)
		//log.dbg("post",doc)
		doc.save(function(err) {
			if (err) {
				self.renderError(err, null, req, res, next);
				return;
			}
			res.send(doc);
		});
	}, this);
};

/**
 * Generate an object of fields to not expose
 */
MongoRest.prototype.generateHiddenFields = function(resource) {
	var hidden_fields = {};

	if (!resource.options || typeof resource.options.hide == 'undefined')
		return {};

	resource.options.hide.forEach(function(dt) {
		hidden_fields[dt] = false;
	});
	return hidden_fields;
};


/** Sec issue
 * Epure incoming data to avoid overwrite and POST request forgery
 * and disallows writing to read-only fields
 */
MongoRest.prototype.epureRequest = function(req, resource) {
	var req_data = req.body;

	if (resource.options === null || (typeof resource.options.hide == 'undefined' && typeof resource.options.readOnly == 'undefined' && typeof resource.options.force == 'undefined'))
		return req_data;

	for(var key in resource.options.force) {
		req_data[key] = eval('('+resource.options.force[key]+')');
	}

	var hidden_fields = _.union(resource.options.hide, resource.options.readOnly);
	_.each(req_data, function(num, key) {
		_.each(hidden_fields, function(fi) {
			if (fi == key)
				delete req_data[key];
		});
	});

	return req_data;
};


/*
 * Entity request goes there first
 * It retrieves the resource
 */
MongoRest.prototype.entity = function() {

	return _.bind(function(req, res, next) {
		if (!(req.resource = this.getResource(req.params.resourceName))) { next(); return; }

		var hidden_fields = this.generateHiddenFields(req.resource);

		//
		// select({_id : false}) invert the select process (hidde the _id field)
		//
		var query = req.resource.model.findOne({ _id: req.params.id }).select(hidden_fields);

		if (req.resource.options && req.resource.options.populate) {
			query = query.populate(req.resource.options.populate);
		}
		query.exec(function(err, doc) {
			if (err) {
				return res.send({
					success : false,
					err : util.inspect(err)
				});
			}
			else if (doc === null) {
				return res.send({
					success : false,
					err : 'Record not found'
				});
			}
			req.doc = doc;
			return next();
		});
	}, this);
};

/**
 * Gets a single entity
 *
 * @return {Function} The function to use as route
 */
MongoRest.prototype.entityGet = function() {
	return _.bind(function(req, res, next) {
		if (!req.resource) {
			return next();
		}
		if(req.doc.schema.methods.get) {
			var add=req.doc.schema.methods.get(req.doc);
			log.dbg(add)
		}
		return res.send(req.doc);
	}, this);
};

MongoRest.prototype.entityPut = function() {

	var self=this
	return _.bind(function(req, res, next) {

		if (!req.resource) { next(); return; } // todo:  what comes next ?
		if (!req.body) throw new Error('Nothing submitted.');
		var epured_body = self.epureRequest(req, req.resource);

		req.resource.options.putPrehandler(req,res, save)

		// Merge
		_.each(epured_body, function(value, name) {
			req.doc[name] = value;
		});

		function save() {
			//log.dbg("put",req.doc)
			if (req.doc.schema.methods.put) req.doc.schema.methods.put(req.doc); // avant sauvegarde
			req.doc.save(function(err) {
				if (err) {
					log.dbg(err)
					return res.status(401).send({success:false,err:err});
				}

				return res.send(req.doc);
			});
		}

	}, this);
};

MongoRest.prototype.entityDelete = function() {

	return _.bind(function(req, res, next) {
		if (!req.resource) { next(); return; }
		log.dbg("delete")
		req.doc.remove(function(err) {
			if (err) {
				return res.send({success : false});
			}
			if (req.doc.schema.methods.delete) req.doc.schema.methods.delete(req.doc);
			return res.send({success : true});
		});
	}, this);
};
