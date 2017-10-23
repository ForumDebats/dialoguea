module.exports = function (grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		DIST: 'public/dist',
		concat: {
			options: {
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n',
				// define a string to put between each file in the concatenated output
				separator: ';\n',
				nonull: true,
				stripBanners:true
			},
			// the files to concatenate
			pub: {
				src: [

					"public/js/utils.js",
					"public/js/filters.js",
					"public/js/directive/mouse.js",
					"public/js/annotation.js",
					"public/js/annotation-touch.js",
					"public/js/factory/restfactory.js",
					"public/js/factory/auth.js",
					//"public/js/factory/socket.js",
					"public/js/factory/broadcast.js",
					"public/js/controler/accueil.js",

					"public/js/controler/translation.js",

					"public/js/directive/clickonce.js",
					"public/js/directive/keys.js",
					"public/js/directive/emailvalid.js",
					"public/js/directive/checkstrength.js",
					"public/js/controler/register.js",
					"public/js/controler/activation.js",
					"public/js/controler/message.js",
					"public/js/controler/requestpass.js",
					"public/js/controler/login.js",
					"public/js/directive/emailvalid.js",
					"public/js/directive/tinymce.js",
					"public/js/controler/debat.js",
					"public/js/controler/nouveaudebat.js",
					"public/js/controler/categories.js",
					"public/js/controler/listedebats.js",
					"public/js/controler/cdebats.js",

					"public/js/controler/debats.js",
					"public/js/controler/restitution.js",
					"public/js/controler/synthese.js",
					"public/js/controler/invitation.js",


					"public/js/controler/account/activate.js",
					"public/js/controler/account/register.js",
					"public/js/controler/account/requestpass.js",
					"public/js/controler/account/updatepass.js",

					"public/js/module/account.js",
					"public/js/module/routes.js",
					"public/js/settings.js",
					"public/js/module/dialoguea.js"


				], dest: 'public/<%= pkg.name %>.js'
			},
			admin: {
				src: [
					"public/js/factory/broadcast.js",
                    "public/js/controler/admin/routes.js",
                    "public/js/controler/admin/directives.js",
                    "public/js/controler/admin/predebat.js",
                    "public/js/controler/admin/debats.js",
					"public/js/controler/admin/opendebat.js",
					"public/js/controler/admin/groups.js",
					"public/js/controler/admin/categories.js",
					"public/js/controler/admin/documents.js",
					"public/js/controler/admin/users.js",
					"public/js/controler/admin/upload.js",
					"public/js/module/admin.js"
				], dest: 'server/views/adminmodule.js'
			},
			deps: {
				src: [
					"public/dist/jquery/dist/jquery.min.js",
					"public/dist/angular/angular.min.js",
					"public/dist/angular-touch/angular-touch.min.js",
					"public/dist/angular-animate/angular-animate.min.js",
					"public/dist/angular-route/angular-route.min.js",
					"public/dist/angular-resource/angular-resource.min.js",
					"public/dist/angular-messages/angular-messages.min.js",
					"public/dist/angular-sanitize/angular-sanitize.min.js",
					"public/dist/angular-translate/angular-translate.min.js",
					"public/dist/angular-ui-router/release/angular-ui-router.min.js",
					"public/dist/Autolinker.js/dist/Autolinker.min.js",
					"public/dist/bcryptjs/dist/bcrypt.min.js",
					"public/dist/underscore/underscore-min.js",
					"public/dist/d3/d3.min.js",
					"public/dist/nanobar/nanobar.min.js",
					"public/dist/oclazyload/dist/ocLazyLoad.min.js",
					"public/lang/angular-locale_fr-fr.js",
					"public/js/d3.ay-pie-chart.js"
				], dest: 'public/<%= pkg.name %>-deps.js'
			}
		},
		'closure-compiler': {
			public: {
				closurePath: '/usr/share/java/',
				js: 'public/<%= pkg.name %>.js',
				jsOutputFile: 'public/<%= pkg.name %>.min.js',
				maxBuffer: 500,
				options: {
					//warning_level : 'QUIET',
					compilation_level: 'SIMPLE',/*'ADVANCED_OPTIMIZATIONS',*/
					angular_pass: true,
					define: ['"ENABLE_DEBUG=false"','"Settings.postTimeout=240000"'],
					language_in:'ES5_STRICT'
				}
				// -W QUIET --angular_pass --compilation_level SIMPLE_OPTIMIZATIONS --js $FileName$
			},

			admin: {
				closurePath: '/usr/share/java/',
				js: 'server/views/adminmodule.js',
				jsOutputFile: 'server/views/adminmodule.min.js',
				maxBuffer: 500,
				options: {
					compilation_level: 'SIMPLE_OPTIMIZATIONS',
					angular_pass: true,

				}
			},
			server: {//hardly, with requires...
				closurePath: '/usr/share/java/',
				js: '<%= pkg.name %>-server.js',
				jsOutputFile: '<%= pkg.name %>-server.min.js',
				maxBuffer: 500,
				options: {
					//language_in:'ES5_STRICT',
					//language_in: 'ECMASCRIPT5_STRICT',
					compilation_level: 'SIMPLE_OPTIMIZATIONS',
					angular_pass: false
				}
			}
		}
	});
	grunt.loadNpmTasks('grunt-closure-compiler');
	grunt.loadNpmTasks('grunt-contrib-concat');

	grunt.registerTask('log', 'Log some stuff.', function () {
		grunt.log.write('Logging some stuff...').ok();
	});

	grunt.registerTask('cat', ['concat:pub']);
	grunt.registerTask('admincat', ['concat:admin']);
	grunt.registerTask('deps', ['concat:deps']);

	grunt.registerTask('min', ['closure-compiler:public']);
	grunt.registerTask('adminmin', ['closure-compiler:admin']);
	grunt.registerTask('depsmin', ['closure-compiler:deps']);


	grunt.registerTask('default', ['concat', 'closure-compiler:public', 'closure-compiler:admin']);

};
