/**
 * Dialoguea
 * restitution.js
 *
 * copyright 2014-2017 Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
 * Released under the AGPL license
 *
 synthèse graphique et restitution, vue chronologique des posts
 Todo : ira dans son propre module
 */

	
var RestitCtrl =
	['$stateParams', '$scope', '$http', 'Debat', 'Docu', function ($stateParams, $scope, $http, Debat, Docu) {

		$scope.order = 'date'
		$scope.reverse = true

		var
			G = this, viewframe,
			margin = {top: 20, right: 0, bottom: 20, left: 10},
			width, height,
			i = 0,
			duration = 750,
			root, tree, diagonal, svg;

		G.cmts = [];
		G.debat = null
		G.synthese = false

		this.init = function (N) {
			var graph = $('#graph1');

			graph.css('height', 300 + N * 9 + 'px')
			viewframe = graph[0]
			width = viewframe.clientWidth
			height = viewframe.clientHeight - margin.bottom - margin.top

			tree = d3.layout.tree()
				.size([height, width]);

			diagonal = d3.svg.diagonal()
				.projection(function (d) {
					return [d.y, d.x];
				});

			svg = d3.select("#graph1").append("svg")
				//.attr("width", width + margin.right + margin.left)
				//.attr("height", height + margin.top + margin.bottom)
				.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

			d3.select(self.frameElement).style("height", "800px");
		}


		function update(source) {

			// Compute the new tree layout.
			var nodes = tree.nodes(root).reverse(),
				links = tree.links(nodes);

			// Normalize for fixed-depth.
			nodes.forEach(function (d) {
				d.y = d.depth * 100;
			});

			// Update the nodes…
			var node = svg.selectAll("g.node")
				.data(nodes, function (d) {
					return d.id || (d.id = ++i);
				});

			// Enter any new nodes at the parent's previous position.
			var nodeEnter = node.enter().append("g")
					.attr("class", "node")
					.attr("transform", function (d) {
						return "translate(" + source.y0 + "," + source.x0 + ")";
					})
					.append("a")
					.attr("xlink:href", function (d) {
						return "#/debat/" + G.debat._id + "/" + d._id
					})
					.attr("target", "_blank")
				;

			nodeEnter.append("circle")
				.attr("r", 1e-6)
				.style("fill", function (d) {
					return d.avis === 0 ? 'green' : d.avis === 1 ? 'red' : d.avis === 2 ? 'blue' : ''
				})

			nodeEnter.append("text")
				.attr("x", function (d) {
					return d.children || d._children ? -10 : 10;
				})
				.attr("dy", ".35em")
				.attr("text-anchor", function (d) {
					return d.children || d._children ? "end" : "start";
				})
				.text(function (d) {
					return d.prenom;
				})
				.style("fill-opacity", 1e-6)


			// Transition nodes to their new position.
			var nodeUpdate = node.transition()
				.duration(duration)
				.attr("transform", function (d) {
					return "translate(" + d.y + "," + d.x + ")";
				});


			nodeUpdate.select("circle")
				.attr("r", function (d) {
					//return d._children ? 8 : 4.5;
					return 2 + Math.log(0.2 + (d.argumentation.length) / 30) //+ childrenTextLength(d);
				})
				.style("fill", function (d) {
					return d.avis === 0 ? 'green' : d.avis === 1 ? 'red' : d.avis === 2 ? 'blue' : ''
				})

			nodeUpdate.select("text")
				.style("fill-opacity", 1);

			// Transition exiting nodes to the parent's new position.
			var nodeExit = node.exit().transition()
				.duration(duration)
				.attr("transform", function (d) {
					return "translate(" + source.y + "," + source.x + ")";
				})
				.remove();

			nodeExit.select("circle")
				.attr("r", 1e-6);

			nodeExit.select("text")
				.style("fill-opacity", 1e-6);

			// Update the links…
			var link = svg.selectAll("path.link")
				.data(links, function (d) {
					return d.target.id;
				});

			// Enter any new links at the parent's previous position.
			link.enter().insert("path", "g")
				.attr("class", "link")
				.attr("d", function (d) {
					var o = {x: source.x0, y: source.y0};
					return diagonal({source: o, target: o});
				});

			// Transition links to their new position.
			link.transition()
				.duration(duration)
				.attr("d", diagonal);

			// Transition exiting nodes to the parent's new position.
			link.exit().transition()
				.duration(duration)
				.attr("d", function (d) {
					var o = {x: source.x, y: source.y};
					return diagonal({source: o, target: o});
				})
				.remove();

			// Stash the old positions for transition.
			nodes.forEach(function (d) {
				d.x0 = d.x;
				d.y0 = d.y;
			});
		}


		Debat.get({id: $stateParams.debatId}).$promise
			.then(function (D) {

				G.debat = D;
				if (D.synthese && D.synthese.length) {
					Docu.get({id: D.synthese[0]}, function (d) {
						G.syntheseLink = "#/synthese/" + d._id
						G.syntheseTitre = d.titre1 + " " + d.titre2
					})
				}

				$http.get('api/cmt/' + D.rootCmt)
					.success(function (data) {

						console_dbg(data)
						G.root = root = data;
						G.init(root.children.length)
						root.x0 = height / 2;
						root.y0 = 0;

						function collapse(d) {
							G.cmts.push(d)
							if (d.children) {
								//d._children = d.children;
								d.children.forEach(collapse);
								//d.children = null;
							}
						}

						root.children.forEach(collapse);
						//collapse(root)
						update(root);
						//setupPieChart(data,svg2,pie1) // see below
						//setupPieChart2(data,svg3,pie2) // see below
						var data = G.setupPies(G.root)
						ay.pie_chart('pie-a', data[0], {percentage: false});
						ay.pie_chart('pie-b', data[1], {percentage: false});
						$('.loading').hide()
					})
					.error(function (e) {
						console_dbg(e)
					});
			})


		G.setupPies = function (data) {
			console_dbg("setup pie")
			var i, contrib = {}, n = undefined
			var dig = function (d) {
				for (var i in d.children) {
					n = d.children[i].uid;
					if (contrib[n]) {
						contrib[n].N++;
						contrib[n].L += d.children[i].argumentation.length;
					} else {
						contrib[n] = {N: 1, label: d.children[i].prenom, L: d.children[i].argumentation.length}
					}
					dig(d.children[i])
				}
			}

			dig(data)
			data = [[], []]
			console_dbg(contrib)
			var j = 1
			for (i in contrib) {
				data[0].push({index: j, "name": contrib[i].label, "value": contrib[i].N})
				data[1].push({index: j, "name": contrib[i].label, "value": contrib[i].L})
				j++;
			}

			return data;
		}


	}]


