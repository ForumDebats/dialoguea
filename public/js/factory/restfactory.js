/**
 * Dialoguea
 * restfactory.js
 *
 * copyright 2015-2017 Forum Des Débats and the following authors
 * authors : Philippe Estival, Jean Sallantin, Claire Ollagnon, Véronique Pinet
 * Released under the AGPL license
 *
 *
 * DB rest ressources factories.js
 * AngularJS Factories
 */

var stdid={id: '@_id'}
var stdquery={
	update: {method: 'PUT'},
	query: {method: 'GET', params: {}, isArray: true}
};

var GroupFactory  = ['$resource', function ($resource) { return $resource('api/groups/:id',      stdid,stdquery); }];
var DocuFactory   = ['$resource', function ($resource) { return $resource('api/docs/:id',        stdid,stdquery); }];
var CatFactory    = ['$resource', function ($resource) { return $resource('api/cat/:id',         stdid,stdquery); }];
var DebatFactory  = ['$resource', function ($resource) { return $resource('api/debat/:id',       stdid,stdquery); }];
var CmtFactory    = ['$resource', function ($resource) { return $resource('api/commentaires/:id',stdid,stdquery); }];

