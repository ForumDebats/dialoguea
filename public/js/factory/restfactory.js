/**
 * Dialoguea
 * restfactory.js
 *
 * copyright 2014-2017 Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
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

