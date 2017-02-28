

var ADMINROUTES = ['$stateProvider', '$urlRouterProvider',
function ($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('opendebat', {
            url: '/opendebat',
            templateUrl: 'section/admin/opendebat.html',
            controller: 'OpenDebatCtrl',
            controllerAs: 'O'
        })
        .state('opendebat.groupList', {
            templateUrl: 'section/admin/group-list.html',
            controller: 'GroupsListCtrl',
            controllerAs: 'G',
            data: {selector: true, section: 'opendebat.'}
        })
        .state('opendebat.group', {
            url: '/groupe/:groupId',
            templateUrl: 'section/admin/group.html',
            controller: 'GroupCtrl',
            controllerAs: 'g',
            data: {section: 'opendebat.'}
        })
        .state('predebat', {
            url: '/previewdebat/:docId',
            templateUrl: 'section/admin/predebat.html',
            controller: 'PreDebatCtrl',
            controllerAs: 'P'
        })
        .state('opendebat.categories', {
            templateUrl: 'section/admin/categories.html',
            controller: 'AdmCategoriesCtrl',
            controllerAs: 'C',
            data: {section: 'opendebat.'}
        })
        .state('opendebat.docList', {
            url: '/documents/:catId',
            templateUrl: 'section/admin/documents.html',
            controller: 'DocListCtrl',
            controllerAs: 'D',
            data: {selector: true, section: 'opendebat.'}
        })
        .state('categories', {
            url: '/categories',
            templateUrl: 'section/admin/categories.html',
            controller: 'AdmCategoriesCtrl',
            controllerAs: 'C',
            data: {section: ''}
        })
        .state('docList', {
            url: '/documents/:catId',
            templateUrl: 'section/admin/documents.html',
            controller: 'DocListCtrl',
            controllerAs: 'D',
            data: {selector: false, section: ''}
        })
        /*.state('documents', {
            templateUrl: 'section/admin/docs.html',
            controller: 'DocsCtrl',
            controllerAs: 'D',
            data: {selector: false},
        })
        .state('documents.list', {
            url:'/docs/:catId',
            views: {
                doc: {
                    templateUrl: 'section/admin/doc-list.html',
                    controller:'DocsListCtrl',
                    controllerAs:'D'
                }
            }
        })
        .state('documents.edit', {
            url:'/docs/edit/:docId',
            views: {
                doc: {
                    templateUrl: 'section/admin/doc-edit.html',
                    controller:'DocEditCtrl',
                    controllerAs:'D'
                }
            }
        })
        */
        .state('groupList', {
            url: '/groupes',
            templateUrl: 'section/admin/group-list.html',
            controller: 'GroupsListCtrl',
            controllerAs: 'G',
            data: {selector: false, section: ''}
        })
        .state('group', {
            url: '/groupe/:groupId',
            templateUrl: 'section/admin/group.html',
            controller: 'GroupCtrl',
            controllerAs: 'g'
        })
        .state('documentDetail', {
            url: '/doc/:docId',
            templateUrl: 'section/admin/documents.html',
            controller: 'DocsCtrl',
            controllerAs: 'D'
        })
        .state('admDebats', {
            url: '/admdebats',
            templateUrl: 'section/admin/debat-list.html',
            controller: 'AdmDebatsCtrl',
            controllerAs: 'D'
        })
        .state('upload', {
            url: '/upload',
            templateUrl: 'section/admin/upload.html',
            controller: 'FileUploadCtrl',
            controllerAs: 'F'
        })
}]
