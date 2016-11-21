(function($P){
	'use strict';

	$P.GraphForceView = $P.defineClass(
		$P.ForceView,
		function GraphForceView(config) {
			var nodes, links,
				self = this,
				textTransform;
				self.generate = false;

			$P.ForceView.call(self, config);

			self.hiddenNodeTypes = {};
			self.highlights = {};
			self.lowlights = {}; 
			self.notes = {};
			self.curSelection = {};
			self.curCertainty = {};
			self.numTrials = 24;


			self.textTransform = self.shape.textTransform(self);
			self.dispatch = d3.dispatch("nodeSelect");
			self.mode = config.parentBubble.mode;

			if (config.displayArgument) {
				self.generate = config.displayArgument.generate;
				self.graphID = config.displayArgument.gID;
				if ('graph' === config.displayArgument.type) {
					self.graph = config.displayArgument;}
				else if ('graphs' === config.displayArgument.type) {
					self.graphs = config.displayArgument.list;
					self.NG = config.displayArgument.totalGs;
					}
				}

			if(config.nodeFilter) {
			 	self.nodesToDelete = config.nodeFilter.toDelete;
			 	self.exitAfter = config.nodeFilter.exitAt;
			 	self.linksToDelete = config.nodeFilter.toDeleteLinks;
			 	self.exitLink = config.nodeFilter.exitLink;
			}

			//self.nodeSelectEvent = document.createEvent("MouseEvents");
			//self.nodeSelectEvent.initEvent("nodeSelected", true, true);

			function nodeSize(target) {
				return function(d) {return target * 1.5;};
				return function(d) {
					var size = 1;
					if (d.componentNodes && d.componentNodes.length) {
						size = Math.pow(d.componentNodes.length, 0.4);}
					return target * size;};}
			self.nodeSize = nodeSize;

			function nodeTitle(d) {
				var title = d.name;
				if (d.componentNodes) {
					title = [d.name, ':'];
					d.componentNodes.forEach(function(node) {
						if (!node || !node.name) {return;}
						title.push('\n');
						title.push(node.name);});
					title = title.join('');}
				return title;}

			function entityFilter1(node) {
				if ('entity' !== node.klass) {return false;}
				//if (node.reactions && node.reactions.length > 0) {return true;}
				//if (node.componentNodes && $P.or(node.componentNodes, entityFilter1)) {return true;}
				//return false;}
					if(self.mode !== 'soup')
					{
						var exists = node.graphs.indexOf(self.index + 1);
				    	if(exists < 0 ) return false;

					}
				    var qid = self.parentBubble.getQid();
					var delID = self.nodesToDelete.indexOf(node.id);
					
					if( delID >= 0 && self.index === self.exitAfter[delID] && (!e1) && (!e2) ) return false;

				return true;}

			function diminishedEntityFilter(node) {
				return !self.visibleEntities.indexed[node.layoutId];}

			function entitylabelFilter(node) {
				if ('entitylabel' !== node.klass) {return false;}
				return self.visibleEntities.indexed['entity:'+node.id];}


			function locationFilter(node) {
				if ('location' !== node.klass) {return false;}
				return $P.or(self.visibleEntities, function(entity) {return entity.location === node.id;});}

			function reactionFilter(node) {
				var i, entities;
				if ('reaction' !== node.klass) {return false;}
				for(var key in node.entities) {
					if (self.visibleEntities.indexed['entity:'+node.entities[key]]) {
						return true;}}
				return false;}


			function isNodeVisible(node) {
				if (!node) {return false;}
				var id = node.layoutId;
				return self.visibleEntities.indexed[id]
					|| self.visibleEntitylabels.indexed[id]
					|| self.visibleLocations.indexed[id]
					|| (self.visibleReactions.indexed[id] && self.generate )
					|| self.diminishedEntities.indexed[id];}

			self.visibleEntities = self.layout.nodes.filter(entityFilter1);
			self.visibleEntities.indexed = $P.indexBy(self.visibleEntities, $P.getter('layoutId'));

	    	self.diminishedEntities = self.visibleEntities.filter(diminishedEntityFilter);
			self.diminishedEntities.indexed = $P.indexBy(self.diminishedEntities, $P.getter('layoutId'));

			self.visibleEntitylabels = self.layout.nodes.filter(entitylabelFilter);
			self.visibleEntitylabels.indexed = $P.indexBy(self.visibleEntitylabels, $P.getter('layoutId'));

			self.visibleReactions = self.layout.nodes.filter(reactionFilter);
			self.visibleReactions.indexed = $P.indexBy(self.visibleReactions, $P.getter('layoutId'));

			self.visibleLocations = self.layout.nodes.filter(locationFilter);
			self.visibleLocations.indexed = $P.indexBy(self.visibleLocations, $P.getter('layoutId'));

			if(self.generate)
				self.visibleNodes = [].concat(self.visibleEntities, self.visibleEntitylabels, self.visibleLocations, self.visibleReactions,  self.diminishedEntities);
			else
				self.visibleNodes = [].concat(self.visibleEntities, self.visibleEntitylabels, self.visibleLocations,  self.diminishedEntities);


			self.visibleLinks = self.layout.links.filter(function(link, linkId) {

				var cond = false; 
				var cond2 = false; 

				if((link.source.klass === 'entity') && (link.target.klass === 'entity') )  
				 cond = (link.source.graphs.length === 1) && (link.target.graphs.length === 1) && (link.source.graphs[0] !== link.target.graphs[0]);
				if (cond)
				{
					console.log('Source: ' + link.source.id);
					console.log('Target: ' + link.target.id);	
				} 
				 if(self.linksToDelete) 
				 	{
				 		var id = self.index + 1; 
				 		var delID = self.linksToDelete.indexOf(link.layoutId);
				 		cond2 = ( delID >= 0 && id === self.exitLink[delID]);
				 	}
				//if (link.klass === 'entity:label') {console.log(link, link.source, link.target, isNodeVisible(link.source),  isNodeVisible(link.target));}
				return link.source && link.target && isNodeVisible(link.source) && isNodeVisible(link.target) && (!cond) && (!cond2);});

			self.drawBackground = self.element.append('g').attr('class', 'layer').attr('pointer-events', 'none');

			function elementLayoutId(element) {return element.__data__.layoutId;}
			var rightclickNote = self.rightclickNote.bind(self);

			self.element.selectAll('.crosshair').append('circle').attr('class', 'crosshair')
				.attr('r', 40)
				.attr('fill', 'yellow')
				.style('opacity', '0');

			self.links = self.element.selectAll('.link').data(self.visibleLinks)
				.enter().append('g').attr('class', 'link');
			self.nodes = self.element.selectAll('.node').data(self.visibleNodes)
				.enter().append('g').attr('class', 'node');
			self.nodes.indexed = $P.indexBy(self.nodes[0], elementLayoutId);
			self.links.indexed = $P.indexBy(self.links, $P.getter('layoutId'));
			self.nodes.call(self.layout.drag);

			self.locations = self.nodes.filter(function(d, i) {return 'location' === d.klass;});
			self.locations.indexed = $P.indexBy(self.locations[0], elementLayoutId);
			
			self.locations.append('circle')
				.attr('stroke', 'black')
				.attr('fill', $P.getter('color'))
				.attr('r', 40)
				.on('dblclick', function(d) {
					//self.setLocationCollapse(d, !self.display.collapsedLocations[d.id]);
					})
				.append('title').text(function(d) {return d.name;});
			self.locations.append('text')
				.style('font-size', '15px')
				.attr('fill', 'black')
				.attr('text-anchor', 'middle')
				.attr('transform', self.shape.textTransform(self))
				.text($P.getter('name'));
			
			self.entityEntityLinks = self.links.filter(
				function(d, i) {return 'entity:entity' === d.klass;});

			self.linkBackgrounds();

			self.locationLinks = self.links.filter(
				function(d, i) {return 'entity:location' === d.klass;});
			self.locationLinks.append('line')
				.attr('stroke', 'grey')
				.attr('stroke-width', 0.5)
				.attr('fill', 'none');

			self.entities = self.nodes.filter(function(d, i) {return 'entity' === d.klass;});
			self.entities.diminished = self.entities.filter(function(d, i) {
				return !self.inGraph(d);});
			self.entities.visible = self.entities.filter(function(d, i) {
				return self.inGraph(d);});

			self.entities.proteins = self.entities.filter(function(d, i) {
				var type = d.type && d.type.toLowerCase();
				return 'protein' == type;});
			self.entities.proteins.composite = self.entities.proteins.filter(
				function(d, i) {return d.componentNodes;});
			self.entities.proteins.crosstalking = self.entities.proteins.filter(
				function(d, i) {return d.crosstalkCount > 1;});

			self.entities.small = self.entities.visible.filter(function(d, i) {
				return 'SmallMolecule' === d.type
					|| 'Rna' === d.type
					|| 'Dna' === d.type;});
			self.entities.complex = self.entities.visible.filter(
				function(d, i) {return 'Complex' == d.type;});
			self.entities.complex.composite = self.entities.complex.filter(
				function(d, i) {return d.componentNodes;});
			self.entities.other = self.entities.visible.filter(
				function(d, i) {
					return 'Complex' !== d.type
						&& 'SmallMolecule' !== d.type
						&& 'Protein' !== d.type && 'protein' !== d.type;});


			// The big transparent background circles encoding location.
			var radius =  (self.parentBubble.graphSize() === 20)? 60 : (self.parentBubble.graphSize() === 50)? 85 : 100;
			self.entities.other.composite = self.entities.other.filter(
				function(d, i) {return d.componentNodes;});
			self.entities.proteins.each(function(d, i) {
				var location = self.layout.getNode('location:'+d.location);
				if (location) {
					self.drawBackground.append('circle')
						.attr('class', 'follower')
						.attr('follow-id', d.layoutId)
						.attr('follow-type', 'protein')
						.attr('stroke', 'none')
						.attr('fill', location.color)
						.attr('fill-opacity', 0.25)
						.attr('pointer-events', 'none') // Can't click on them.
						.attr('r', radius);}});


			// Nodes in the pathway.
			// An extra box indicating crosstalk.
			 self.entityBackgrounds();

			// The main circle.
			 /*self.entities.diminished
				.each($P.D3.Diminished.appender({
					size: nodeSize(14)}))
				.selectAll('.diminished-entity')
				.attr('pointer-events', 'all')
				.attr('transform', textTransform)
				.on('click', function(d) {
					$P.state.scene.record({
						type: 'force-click',
						class: d.klass,
						id: d.layoutId,
						diminished: true,
						name: d.name,
						source: self.parentBubble});
					console.log(d);})
				.call(rightclickNote)
				.append('title').text(nodeTitle);
				*/
			self.entities.proteins.objects = {};


			var app;
			self.star = self.parentBubble.isStarDisplay();
			//var location = self.layout.getNode('location:'+d.location);

			if(self.star)
			{
				if(self.mode === 'soup'){
				app = $P.D3.SoupSunEntity.appender({
					transform: textTransform,
					size: nodeSize(14),
					graphs: self.graphs,
					view: self,
					fill: self.getExpressionColor.bind(self),
					collector: self.entities.proteins.objects});
					
				}
				else
				{
				app = $P.D3.SunEntity.appender({
					transform: textTransform,
					size: nodeSize(14),
					graphs: self.graphs,
					view: self,
					fill: self.getExpressionColor.bind(self),
					collector: self.entities.proteins.objects});
				}
			}
			else
			{
				app = $P.D3.Protein.appender({
					transform: textTransform,
					size: nodeSize(14),
					viewID: self.index,
					graphSize: self.parentBubble.graphSize(),
					//fill: self.getExpressionColor.bind(self),
					fill: self.getLocationColor.bind(self),
					collector: self.entities.proteins.objects});
			}

			
			/*self.ctrlPressed = false; 
			$(window).keydown(function(e){
    		if (e.ctrlKey)
    			self.ctrlPressed = true; 
      			  //console.log('Control Down');
				});
				*/

			self.entities.proteins
				.each(app)
				.selectAll('.protein')
				.attr('pointer-events', 'all')
				.on('click', function(d) {
					if(d3.event.shiftKey)
					{
						
					//self.parentBubble.printSelection();
					/*
					$P.state.scene.record({
						type: 'force-click',
						class: d.klass,
						id: d.layoutId,
						name: d.name,
						source: self.parentBubble
						});
					*/
					//console.log(d);

					self.parentBubble.setNodeSelection(d.id);
					self.parentBubble.printSelection();

					var qType = self.parentBubble.getQtype();
					if(qType === 102 || qType === 2 || qType === 104 || qType === 4)
					 {
						self.highlight(d);
					 	pre_state = true;
						for(var k in scaleboxes)
							{
							var s = scaleboxes[k];
							s.setEnabled();
							}
					 }
				   }
				   else
				   	 self.parentBubble.recordAction('click'+ d.layoutId);
				})
				//.on('click', function(d) {
				//   self.parentBubble.recordAction('click'+ d.layoutId);
				//})
				//.call(rightclickNote)
				.append('title').text(nodeTitle);


			self.entities.proteins.composite.selectAll('.component').data(function(d) {return d.componentNodes;}).enter()
				.append('circle')
				.attr('stroke', 'black')
				.attr('fill', self.getExpressionColor.bind(self))
				.attr('r', function(d, i) {return nodeSize(3)(d3.select(this.parentNode).datum());})
				.attr('transform', function(d, i) {
					var pd = d3.select(this.parentNode).datum();
					return 'rotate(' + (i * 360 / pd.componentNodes.length) + ')translate(' + nodeSize(8)(pd) + ')';
				})
				.attr('pointer-events', 'all')
				.on('click', function(d) {
					$P.state.scene.record({
						type: 'force-click',
						class: d.klass,
						id: d.layoutId,
						name: d.name,
						source: self.parentBubble});
					console.log(d);})
				.call(rightclickNote)
				.append('title').text(nodeTitle);
			// Small Molecules.
			self.entities.small.objects = {};
			self.entities.small
				.each($P.D3.Small.appender({
					transform: textTransform,
					size: nodeSize(14),
					fill: self.getExpressionColor.bind(self),
					collector: self.entities.small.objects}))
				.selectAll('.small')
				.attr('pointer-events', 'all')
				.on('click', function(d) {
					$P.state.scene.record({
						type: 'force-click',
						class: d.klass,
						id: d.layoutId,
						name: d.name,
						source: self.parentBubble});
					console.log(d);})
				.call(rightclickNote)
				.append('title').text(nodeTitle);
			// Complex.
			self.entities.complex
				.append('rect')
				.attr('stroke', 'black')
				.attr('fill', self.getExpressionColor.bind(self))
				.attr('width', nodeSize(10)).attr('height', nodeSize(10))
				.attr('x', nodeSize(-5)).attr('y', nodeSize(-5))
				.attr('transform', textTransform + 'rotate(45)')
				.attr('pointer-events', 'all')
				.on('click', function(d) {
					$P.state.scene.record({
						type: 'force-click',
						class: d.klass,
						id: d.layoutId,
						name: d.name,
						source: self.parentBubble});
					console.log(d);})
				.call(rightclickNote)
				.append('title').text(nodeTitle);
			self.entities.complex.composite.selectAll('.component').data(function(d) {return d.componentNodes;}).enter()
				.append('circle')
				.attr('stroke', 'black')
				.attr('fill', self.getExpressionColor.bind(self))
				.attr('r', function(d, i) {return nodeSize(3)(d3.select(this.parentNode).datum());})
				.attr('transform', function(d, i) {
					var pd = d3.select(this.parentNode).datum();
					return 'rotate(' + (i * 360 / pd.componentNodes.length) + ')translate(' + nodeSize(8)(pd) + ')';})
				.attr('pointer-events', 'all')
				.on('click', function(d) {
					$P.state.scene.record({
						type: 'force-click',
						class: d.klass,
						id: d.layoutId,
						name: d.name,
						source: self.parentBubble});
					console.log(d);})
				.call(rightclickNote)
				.append('title').text(nodeTitle);

			// Other
			self.entities.other
				.append('rect')
				.attr('stroke', 'black')
				.attr('fill', self.getExpressionColor.bind(self))
				.attr('width', nodeSize(10)).attr('height', nodeSize(10))
				.attr('x', nodeSize(-5)).attr('y', nodeSize(-5))
				.attr('transform', textTransform)
				.attr('pointer-events', 'all')
				.on('click', function(d) {
					$P.state.scene.record({
						type: 'force-click',
						class: d.klass,
						id: d.layoutId,
						name: d.name,
						source: self.parentBubble});
					console.log(d);})
				.call(rightclickNote)
				.append('title').text(nodeTitle);
			self.entities.complex.composite.selectAll('.component').data(function(d) {return d.componentNodes;}).enter()
				.append('circle')
				.attr('stroke', 'black')
				.attr('fill', self.getExpressionColor.bind(self))
				.attr('r', function(d, i) {return nodeSize(3)(d3.select(this.parentNode).datum());})
				.attr('transform', function(d, i) {
					var pd = d3.select(this.parentNode).datum();
					return 'rotate(' + (i * 360 / pd.componentNodes.length) + ')translate(' + nodeSize(8)(pd) + ')';})
				.attr('pointer-events', 'all')
				.on('click', function(d) {
					$P.state.scene.record({
						type: 'force-click',
						class: d.klass,
						id: d.layoutId,
						name: d.name,
						source: self.parentBubble});
					console.log(d);})
				.call(rightclickNote)
				.append('title').text(nodeTitle);

			self.entityLabels = self.nodes.filter(
				function(d, i) {return 'entitylabel' === d.klass;});
			var fontSize = (self.parentBubble.graphSize() === 20)? 12 : (self.parentBubble.graphSize() === 50)? 17 : 18;
			self.entityLabels.append('text')
				.style('font-size', fontSize+'px')
				.attr('text-anchor', 'middle')
				.attr('fill', 'black')
				.attr('transform', self.shape.textTransform(self))
				.attr('pointer-events', 'all')
				.text($P.getter('name'));
			self.entityLabelLinks = self.links.filter(
				function(d, i) {return 'entity:label' === d.klass;});
			self.entityLabelLinks.append('line')
				.attr('stroke', 'black')
				.attr('stroke-width', 1)
				.attr('stroke-opacity', 0.2)
				.attr('fill', 'none');
			self.entityEntityLinks = self.links.filter(
				function(d, i){return 'entity:entity' === d.klass; });
			self.linkBackgrounds();



			self.reactionLinks = self.links.filter(
				function(d, i) {return 'reaction:entity' === d.klass;
				});
			self.reactions = self.nodes.filter(function(d, i) {return 'reaction' === d.klass;});
			self.linkBackgrounds();

			if(self.generate)
				self.makeReactionLinks();
			else
				self.makeEntityLinks();

			/*self.entityEntityLinks.append('line')
				.attr('stroke', 'black')
				.attr('stroke-width', 1)
				.attr('stroke-opacity', 0.5)
				.attr('fill', 'none');
			*/

			if (self.graph) {
				self.root.each($P.D3.PathwayLabel.appender(
					{text: self.graph.name,
					 fill: self.graph.color,
					 view: self},
					function(label) {self.label = label;}));}
			else if (self.graphs)
			{
				var data = self.graphs.map(function(graph) {
							return {
								name: graph.name,
								color: graph.color
								};
						});

				self.labels = self.root.selectAll('.pathway-label').data(data).enter().append('g')
					.each($P.D3.PathwayLabel.appender(
						function(d, i) {return {
							element: this,
							view: self,
							text: d.name,
							fill: d.color,
							graphSize: self.parentBubble.graphSize(),
							index: i};}));

			}

			// build selections of all follower nodes for a given node.s
			self.followerNodes = self.element.selectAll('.follower');



			// Highlighting
			function unhighlight(d, i) {
				self.highlights = {};
				self.updateNodes(self.nodes);
				self.updateLinks2(self.links, d);
				self.layout.updateDisplay();}

			/*
			self.entities //.selectAll('*')
				.on('mouseover', highlight)
				.on('mouseout', unhighlight);
			*/

			self.updateNodes(self.nodes);
			self.updateLinks(self.links);

			},
		{

			highlight: function(d, answer, give) {
				var self = this;
			
				//self.highlights = self.layout.getAdjacentNodes(d, 0);
				var allHighlights = self.parentBubble.getNodeSelection();
				for(var k in allHighlights)
				//for(var k in self.highlights)
				{
					if(!self.highlights[k])
						self.highlights[k] = self.index;
				}

				if(d.layoutId in self.lowlights){
					delete self.lowlights[d.layoutId];
				}
				else if( ((d.layoutId in self.highlights) && !answer) ) {
					delete self.highlights[d.layoutId];
					self.parentBubble.deleteNodeSelection(d.layoutId);
				}
				else if ((d.layoutId in self.highlights) && !(d.layoutId in answer) )
				{
					self.lowlights[d.layoutId] = 1; 
					delete self.highlights[d.layoutId];
					self.parentBubble.deleteNodeSelection(d.layoutId);
				}
				else
					self.highlights[d.layoutId] = 1;

				self.parentBubble.setNodeSelection(self.highlights);

				self.updateNodes(self.nodes);
				//self.updateLinks2(self.links, d);
				//self.layout.updateDisplay();
			},

			inGraph: function(node) {
				if (!this.graph && !this.graphs) {return true;}

				if ('entity' === node.klass) {
					if (!node.graphs) {return true;}
					function check(graph) {
						return node.graphs[parseInt(graph.id)];}
					if (this.graph && check(this.graph)) {return true;}
					if (this.graphs && this.graphs.some(check)) {return true;}
					return false;}

				else if ('reaction' === node.klass) {
					// TODO implement
					return true;}

				return false;},

			deleteNodeSelection: function(nodeID)
			{
				var self = this;
				if(nodeID in self.highlights)
					delete self.highlights[nodeID];
			},
			giveAnswer: function(answer)
			{
				console.log(answer);
				var self = this;
				self.entities.proteins.each(function(e, eid){
					if(answer[e.layoutId] || self.highlights[e.layoutId])
						self.highlight(e, answer);
				});
				var qType = self.parentBubble.getQtype();
				if(qType === 103)
				{
					listBox.giveAnswer(answer);
				}
				pre_state = true;
				for(var k in scaleboxes)
					{
						var s = scaleboxes[k];
						s.setEnabled();
					}

			},
			activeGraphs: function(component) {
				var graphs = [];
				if (!this.graph && !this.graphs) {return graphs;}

				if ('reaction:entity' === component.klass) {
					return this.activeGraphs(component.entity);}

				if('entity:entity' === component.klass)
				 {
					if(this.graphs)
					{
						this.graphs.forEach(function(graph){
								//if(component.graphs[parseInt(graph.id)])
								var index = component.graphs.indexOf(parseInt(graph.id));
								if( index >= 0 )
									graphs.push(graph);
								});
					}
				 }
				if ('entity' === component.klass) {
					if (!component.graphs) {return graphs;}
					if (this.graph && component.graphs[parseInt(this.graph.id)]) {
						graphs.push(this.graph);}
					if (this.graphs) {
						this.graphs.forEach(function(graph) {
							if (component.graphs.indexOf(graph.id) >= 0) {
								graphs.push(graph);}});}}

				return graphs;},

			getExpression: function(node) {
				if (this.graph) {
					return this.graph.expression[node.name];}
				if (this.graphs) {
					//return $P.or(this.graphs, function(graph) {return graph.expression[node.id];});
					 return this.graphs[this.index].expression[node.id];
						}
				return null;},

			getExpressionColor: function(node) {
				var expression = this.getExpression(node);
				if ('up' === expression) {return '#f00';}
				if ('down' === expression) {return '#0f0';}
				return 'white';
				},
			getLocationColor: function(node){
				var self = this; 
				var location = self.layout.getNode('location:'+node.location);
				//console.log(location);
				return location.color;
				},
			onShapeChange: function() {
				var self = this;
				$P.ForceView.prototype.onShapeChange.call(self);
				if (self.label) {
					self.label.onShapeChange(self.shape);}
				if (self.labels) {
					self.labels.each(function(d, i) {
					   if (d.name === 'Graph'+(self.index+1))
						d.manager.onShapeChange(self.shape);});}},

			delete: function() {
				$P.ForceView.prototype.delete.call(this);
				if (this.label) {this.label.remove();}
				if (this.labels) {this.labels.remove();}},

			linkBackgrounds: function() {},

			entityBackgrounds: function() {},

			makeReactionLinks: function() {
				this.reactionLinks.each($P.D3.ReactionLink.appender());
				},


			makeEntityLinks: function() {
				var self = this;
				if(self.graphs) var color = 'grey'; //self.graphs[self.index].color;
				var app;
				//if(self.star)
				//	app = $P.D3.StarLink.appender({stroke: 'green'});
				//else
				   app = $P.D3.EntityLink.appender({stroke: color});
				this.entityEntityLinks.each(app);
				},

			isNodeVisible: function(node, element) {
				var self = this,
						selection, follow, key;

				if (element) {
					selection = d3.select(element);
					node = node || selection.datum();
					follow = selection.attr('follow-id');
					if (follow) {
						return self.isNodeVisible(self.layout.getNode(follow));}}

				if ('entitylabel' === node.klass) {
					return self.isNodeVisible(self.layout.getNode('entity:' + node.id));}

				if (self.display.collapsedLocations[node.location]) {return false;}

				if ('location' === node.klass) {key = 'location';}
				else if ('reaction' === node.klass) {key = 'reaction';}
				//else if ('paper' === node.klass) {key = 'paper';}
				else if (!this.inGraph(node)) {key = 'diminished';}
				else if ('protein' === node.type.toLowerCase()) {key = 'protein';}
				else if (-1 !== ['SmallMolecule','Rna','Dna'].indexOf(node.type)) {key = 'small';}
				else if ('Complex' === node.type) {key = 'complex';}
				else if ('entity' === node.klass) {key = 'other';}

				if (self.hiddenNodeTypes[key]) {return false;}

				return true;},

			onSearch: function(key) {
				var i, regex, results = {};

				this.searchKey = key;
				if (key) {
					regex = key.split('').join('.*');}

				$.each(this.entities.proteins.objects, function(layoutId, protein) {
					var d = protein.datum;
					var target = d.name || d.id || layoutId;
					protein.searchMatch = key && target.match(regex) || false;});

				this.nodes.each(function(node) {
					var target = '' + (node.name || node.id || node.layoutId);
					node.searchMatch = target.match(regex);
					if (['entity', 'reaction'].indexOf(node.klass) != -1
							&& node.searchMatch) {
						results[node.layoutId] = node;}});

				return results;},

			zoomTo: function(entity) {
				var scale = this.zoom.scale();
				var translate = [-scale * entity.x, -scale * entity.y];
				console.log(scale, translate);
				this.zoom.scale(scale).translate(translate);
				var crosshair = $(this.element).find('.crosshair');
				crosshair.css('x', entity.x);
				crosshair.css('y', entity.y);
				crosshair.fadeIn(150).fadeOut(150);
				this.onZoom();},

			updateNodes: function(selection) {
				var self = this;

				selection.style('display', function(d, i) {
					return self.isNodeVisible(d, this) ? '' : 'none';});

				selection.each(function(d, i) {
					if (!d) {return;}

					var selection = d3.select(this);

					if ('entity' === d.klass || 'reaction' === d.klass) {
						var highlights = self.highlights[d.layoutId];
						var lowlights = self.lowlights[d.layoutId];
						d.highlighted = highlights + 1;
						d.lowlighted = lowlights + 1;
						if (d.displays) {
							d.displays.forEach(function(display) {
								if(display.viewID === self.index)
									display.highlighted = highlights + 1;
								display.lowlighted = lowlights + 1; 
								});
							}
						}

					if ('location' === d.klass) {
						selection.attr('stroke-width', self.display.collapsedLocations[d.id] ? 5 : 1);}});

			},

			updateLinks2: function(selection, datum) {
				var self = this;
				var undef;

				selection.style('display', function(d, i) {
					function visible(node) {
						return node && (
							self.isNodeVisible(node)
								|| (node.locationCollapsed && 'reaction:entity' === d.klass));}
					return (visible(d.source) && visible(d.target)) ? '' : 'none';});

				selection.each(function(d, i) {
					var selection = d3.select(this);

					var highlighted =
								d.source.highlighted && d.target.highlighted
								&& Math.min(d.source.highlighted, d.target.highlighted) && (d.source.id === datum.id);
					if(highlighted === false) highlighted = undef;
					d.highlighted = highlighted;

					if (d.displays) {
						d.displays.forEach(function(display) {
								display.highlighted = highlighted + 1;
							});

						}});
			},

			updateLinks: function(selection) {
				var self = this;

				selection.style('display', function(d, i) {
					function visible(node) {
						return node && (
							self.isNodeVisible(node)
								|| (node.locationCollapsed && 'reaction:entity' === d.klass));}
					return (visible(d.source) && visible(d.target)) ? '' : 'none';});

				selection.each(function(d, i) {
					var selection = d3.select(this);

					var highlighted =
								d.source.highlighted && d.target.highlighted
								&& Math.min(d.source.highlighted, d.target.highlighted);
					d.highlighted = highlighted;

					if (d.displays) {
						d.displays.forEach(function(display) {
							display.highlighted = highlighted + 1;});}});
			},

			setLocationCollapse: function(location, collapsed) {
				var self = this,
						locationNode;

				if (self.display.collapsedLocations[location.id] == collapsed) {return;}
				self.display.collapsedLocations[location.id] = collapsed;

				locationNode = self.locations.indexed[location.layoutId];
				self.updateNodes(d3.select(locationNode));

				location.links.forEach(function(link) {
					link.source.locationCollapsed = collapsed;
					var node = self.nodes.indexed[link.source.layoutId];
					self.updateNodes(d3.select(node));});

				self.updateNodes(self.entityLabels);
				self.updateLinks(self.reactionLinks);
				self.updateLinks(self.entityLabelLinks);
				self.updateLinks(self.locationLinks);
				self.updateNodes(self.followerNodes);

				self.layout.updateDisplay();},

			setNodeTypeHidden: function(nodeType, hidden) {
				var self = this,
						updateNode, updateLink;

				if (self.hiddenNodeTypes[nodeType] == hidden) {return;}
				self.hiddenNodeTypes[nodeType] = hidden;

				if ('paper' === nodeType) {
					self.updateNodes(self.papers);
					self.updateLinks(self.paperLinks);}
				else if ('reaction' === nodeType) {
					self.updateNodes(self.reactions);
					self.updateLinks(self.paperLinks);
					self.updateLinks(self.reactionLinks);}
				else {
					if ('diminished' === nodeType) {
						self.updateNodes(self.entities.diminished);}
					else if ('protein' === nodeType) {
						self.updateNodes(self.entities.proteins);}
					else if ('small' === nodeType) {
						self.updateNodes(self.entities.small);}
					else if ('complex' === nodeType) {
						self.updateNodes(self.entities.complex);}
					else if ('other' === nodeType) {
						self.updateNodes(self.entities.other);}
					self.updateNodes(self.entityLabels);
					self.updateLinks(self.reactionLinks);
					self.updateLinks(self.entityLabelLinks);
					self.updateLinks(self.locationLinks);}

				self.updateNodes(self.followerNodes);},

			rightclickNote: function(selection) {

				var self = this;
				var qType = self.parentBubble.getQtype();
				if(qType === 102 || qType === 2 || qType === 104 || qType === 4)
					{
					selection.on('contextmenu', function(d, i) {
						d3.event.preventDefault();

						/*
						self.highlight(d);

						pre_state = true;
						for(var k in scaleboxes)
							{
							var s = scaleboxes[k];
							s.setEnabled();
							}
							*/
						});

					}
				else
				 {
				  selection.on('contextmenu', function(d, i) {
				  		d3.event.preventDefault();
				  	});
				 }

				/*
				selection.on('contextmenu', function(d, i) {
					d3.event.preventDefault();
					if (this.note) {
						this.note.delete();
						delete self.notes[this.note.id];
						this.note = null;}
					else {
						this.note = new $P.NoteFrame({
							w: 200, h: 100,
							follow: this, followLayoutId: d.layoutId,
							parent: self.parentBubble});
						self.notes[this.note.id] = this.note;}
				});
				*/
			}

		});

		var pre_state = false;
		var but_state = false;
		var but_color = 'red';
		var but_rect;

		var scaleboxes = {};
		var listBox;


		function titleScreen(parentSelection, myText, width, height, title, button_text, qid, parent, instructions) {
			var dialog = parentSelection.append('div')
			.attr('id', 'dialog-message')
			.style('font-size', '16px')
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle');


			var ddiv = dialog.append('div')
						.style('margin-left', '23px');
				ddiv.append('p')
					.style('font-size', '16px')
					.attr('fill', 'black')
					.attr('dominant-baseline', 'middle')
					.text(myText);

			if(instructions)
			{
				for(var i=0; i< instructions.length; i++)
				{
					ddiv.append('p')
					 	.style('font-size', '14px')
					 	.style('margin-left', '35px')
					 	.style('margin-top', '35px')
						.attr('fill', 'black')
						.attr('dominant-baseline', 'middle')
						.text(' - ' + instructions[i]);
				}
			}

			
			$(dialog).dialog({
				   //	dialogClass: 'ui-dialog-osx',
				    //dialogClass: 'alert',
					resizable: false,
					title: title,
					modal: true,
					width: width,
					height: height,
					position: ['center', 'center'],
					bgiframe: false,
					hide: {effect: 'scale', duration: 1},
					open: function() {
							$(this).attr('fill', 'blue');
							//$('.ui-button').style('align', 'left');
							//$('.ui-dialog-buttonpane').attr('float', 'center');
							//$('.ui-dialog').attr('text-align', 'center');
							//$('.ui-dialog-buttonpane').attr('text-align', 'center');


					},
					buttons: [{
								text: button_text,
								click: function() {
									$(this).dialog('close');
									}
								}],

					close: function(){
					  	//parent.newQuestion();
					  	//qid = parent.getQid();
						event = {
												name: 'addGraph',
												question: parent.getQid(),
												reload: true
												};
		  				parent.receiveEvent(event);
					}
				});
			
			}


	$P.GraphForceView.makeLegend = function(content, parentSelection, width, height, viewID, timeoutEvent) {
			var answerReady = content.parent.getAnswerReady();
	//  Question pool:
		var practice_questions = [ ' For the subnetwork containing the most nodes,\n mark the nodes that are missing in one graph but not the other. ',  // soup
								   ' For the subnetwork containing the most nodes,\n  mark the nodes that are missing in one graph but not the other.',  // soup
								   ' For the subnetwork containing the most nodes,\n mark the nodes that are missing in one graph but not the other.',  // sm
								   ' For the subnetwork containing the most nodes,\n mark the nodes that are missing in one graph but not the other.',  // sm
								   ' For the subnetwork containing the most nodes,\n mark the nodes that are missing in one graph but not the other.',  // mirror
								   ' For the subnetwork containing the most nodes,\n mark the nodes that are missing in one graph but not the other.',  // mirror
								  // ' Which graph does not contain node "X"?',  // mirror
									/*
								   ' Which node(s) exist in one graph but not the other? ',   // soup
								   ' Which node(s) exist in one graph but not the other? ',   // soup
								   ' Which node(s) exist in one graph but not the other? ',   // sm
								   ' Which node(s) exist in one graph but not the other? ',   // sm
								   ' Which node(s) exist in one graph but not the other? ',   // mirror
								   ' Which node(s) exist in one graph but not the other? ',   // mirror
								   //' Which node(s) exist in one graph but not the other? ',   // mirror
									*/
									'Estimate the number of node differences between the two graphs.',
									'Estimate the number of node differences between the two graphs.',
									'Estimate the number of node differences between the two graphs.',
									'Estimate the number of node differences between the two graphs.',
									'Estimate the number of node differences between the two graphs.',
									'Estimate the number of node differences between the two graphs.'
								   //' How does the number of nodes adjacent to node "H" change from the blue graph to the red graph? ',  // mirror
								  // ' Which of the group "X" nodes is/are connected to 4 or more nodes in all graphs?',  // mirror
									];

		var questions = ['For the subnetwork containing the most nodes,\n mark the nodes that are missing in one graph but not the other. ',  // soup - small data (20 nodes) 0
						 //'Mark all the node(s) that exist in one graph but not the other. ',   // soup  9  --> 18
						 'Estimate the number of node differences between the two graphs.'
						 ];


			var mode = (content.mode === 'sm')? 'Small Multiples':(content.mode === 'soup')? ' VisGumbo': ' VisMirrors';
			var qi = content.parent.getQid();    	// first question
			var ql = content.parent.getQlabel();		// question label

			content.svg.append('text')
				.style('font-size', '14px')
		  		.attr('fill', 'black')
		  		.attr('x', width - 180)
		  		.attr('y', 20  )
		  		.style('font-weight', 'bold')
		  		.text('Method:' + mode);
			if(ql > 0)
			{
		  	content.svg.append('text')
				.style('font-size', '14px')
		  		.attr('fill', 'black')
		  		.attr('x', width - 180)
		  		.attr('y', 40  )
		  		.style('font-weight', 'bold')
		  		.text('Question:' + ql + '/72');
			}

		var legend = parentSelection.append('svg').attr('class', 'legend').style("float", "right");
		var self = this;
		var sep1 = width * 0.5;
		var sep2 = sep1+ width*0.3;
		 var numTrials = 72;
		 var numPractice = 12;
		var curQ;


		var qt = 0; 	// question type
		
		this.button = 0;

		// if(qi > 100 && qi < 200)
		if(qi >= 203)
		 {
		 	//sep1 += width * 0.125;
		 	qi -= 202;
			curQ = displayPractice(qi);
		 }
		 else if( qi < 200)
		   curQ = displayQuest(qi, ql, qt);

		 else if (qi >=200)
		 {
		 	curQ = displayNone(); 
		 	but_color = 'green';
		 }
		 	

		// create a separator between the graph view and the question view
		legend.append('line')
			.attr('stroke', 'black')
			.attr('stroke-width', 4)
			.attr('x1', 0).attr('y1', 0)
			.attr('x2', width).attr('y2', 0);


		// create small separators between the question, answer choices, and the Next button
		legend.append('line')
			.attr('stroke', 'grey')
			.attr('stroke-width', 0.7)
			.attr('x1', sep1).attr('y1', 0)
			.attr('x2', sep1).attr('y2', height);


		legend.append('line')
			.attr('stroke', 'grey')
			.attr('stroke-width', 0.7)
			.attr('x1', sep2).attr('y1', 0)
			.attr('x2', sep2).attr('y2', height);


		var button = legend.append('g')
					.attr('id', 'button');

		var conceal;
		if(timeoutEvent)
		{
			but_color = 'red';
			but_state = false;
		}
		 but_rect = button.append('rect')
				.attr('x', sep2 +  width*0.33 / 4 - 75)
				.attr('y', height/2 - 30)
				.attr('rx', 4)
				.attr('ry', 4)
				.attr('width', 130)
				.attr('height', 35)
				.attr('stroke-width', 1)
				.attr('stroke', but_color)
				.attr('fill', '#ddd');

		var qType = content.parent.getQtype();
		var time_limited = (qType === 103 || qType === 3) && !answerReady;

		var but_text = (content.parent.getQcount() >= (numTrials - 1) && !time_limited)? ' Finish' : time_limited? 'Done': ' Next ';
		if(qType === 200) but_text = 'Start';

		var but_text = button.append('text')
				.style('font-size', '16px')
		  		.attr('fill', 'black')
		  		.attr('x', sep2 +  width*0.33 / 4 - 35)
		  		.attr('y', height/2 - 8  )
		  		.text(but_text);



		 var cbutton;

		function displayNone() {}



		function displayPractice(i)
		{
			var quest = legend.append('text')
				.style('font-size', '18px')
				.style('font-weight', 'bold')
				.style('font-decoration', 'underline')
				.attr('fill', 'black')
				.attr('x', 20)
				.attr('y', 40)
				.attr('dominant-baseline', 'middle')
				.text('Task ' + Math.ceil(i/6)  + ': ');

			 quest.append('tspan')
				.style('font-size', '16px')
				.style('font-weight', 'normal')
				.attr('fill', 'black')
				.attr('dominant-baseline', 'middle')
				.text(practice_questions[i-1]);

			if (i === 1 || i === 2 || i === 7 || i === 8)
			{
				quest.append('tspan')
				.style('font-size', '16px')
				.style('font-weight', 'normal')
				.attr('fill', 'black')
				.attr('dominant-baseline', 'middle')
				.attr('x', 120)
				.attr('dy', 20)
				.text('');

			}
			else if( i === 4 || i === 6)
			{
				quest.append('tspan')
				.style('font-size', '16px')
				.style('font-weight', 'normal')
				.attr('fill', 'black')
				.attr('dominant-baseline', 'middle')
				.attr('x', 110)
				.attr('dy', 20)
				.text('');
			}
			else if( i === 10 || i === 12)
			{
				quest.append('tspan')
				.style('font-size', '16px')
				.style('font-weight', 'normal')
				.attr('fill', 'black')
				.attr('dominant-baseline', 'middle')
				.attr('x', 110)
				.attr('dy', 20)
				.text('');
			}


			return quest;
		}




		//curQ = displayQuest(qi, ql, qt);   // display the first question


		function displayQuest(i, l, t)
		{
			var qlabel = Math.ceil((i+1)/36);
			var Qindex = (i < 36)? 0: ((i < 72)? 1: 2);
			//var qlabel = content.parent.getQtype();
			var quest = legend.append('text')
				.style('font-size', '18px')
				.style('font-weight', 'bold')
				.style('font-decoration', 'underline')
				.attr('fill', 'black')
				.attr('x', 20)
				.attr('y', 40)
				.attr('dominant-baseline', 'middle')
				.text('Task ' + qlabel + ': ');

			 quest.append('tspan')
				.style('font-size', '16px')
				.style('font-weight', 'normal')
				.attr('fill', 'black')
				.attr('dominant-baseline', 'middle')
				.text(questions[Qindex]);   // global question ID
			return quest;
		}


		//////////////////////////////////////////////////////////////////////////////////////////

		
		////////////////////////////////////////////////////////////////////////////////////////




		var leftX = width - 165;




		// Create Answer choices
		var checkboxes = {};
		var radioboxes = {};
		var tBox;

		var callback = function(id, state) {
				pre_state = true;
				for(var k in scaleboxes)
				{
				  var s = scaleboxes[k];
				  s.setEnabled();
				}
				if(state) self.curSelection = id;
				for(var key in radioboxes)
				{
				 var radio = radioboxes[key];
				 if(state && key !== id)
				  	radio.state = !state;
				}
			}

		var callback2 = function(id, state) {
			for(var key in scaleboxes)
			{
				var scale = scaleboxes[key];
				if(state && key !== id)
					scale.state = !state;
			}
			if(state) self.curCertainty = id;
			if(pre_state){
				but_state = true;
				but_color = 'green';
				but_rect.attr('stroke', but_color);
			}
		}
		var getTextInput = function(id){
				console.log(id);
				pre_state = true;
				for(var k in scaleboxes)
				{
				  var s = scaleboxes[k];
				  s.setEnabled();
				}
				self.curSelection = id;
		}
		function checkbox(id, y) {
			checkboxes[id] = new $P.D3.Checkbox({
				parentSelection: legend,
				x: sep1 + 3, y: y - 1,
				state: false,
				callback: function(state) {
					callback(id, state);}
			});}


		function radiobox(id, x, y) {
			radioboxes[id] = new $P.D3.Radiobox({
				parentSelection: legend,
				parentBubble: content.parent,
				x: x, y: y - 1,
				state: false,
				callback: function(state) {
					callback(id, state);}
			});}
		function textbox(id, x, y) {
			tBox = new $P.D3.Textbox({
						parentSelection: legend,
						parentBubble: content.parent,
						x: x, y: y - 1,
						state: false,
						callback: function(id) {
							 getTextInput(id);
						}
					});
			  return tBox;
			 }
		function scalebox(id, x, y) {
			scaleboxes[id] = new $P.D3.Scale({
				parentSelection: legend,
				parentBubble: content.parent,
				x: x, y: y - 1,
				state: false,
				callback: function(state) {
					callback2(id, state);}
			});}



		console.log(qi);
		console.log(qType);
		var y = 30;
		var x = sep1 + 30;
		var textX = sep1 + 60;

	 if(qType < 200)
	 {
		 if( qType === 102 || qType === 104 || qType === 101 || qType === 103)
			{

			cbutton = legend.append('g')
					.attr('id', 'cbutton');

			 var cbut_rect = cbutton.append('rect')
				.attr('x', width - 130)
				.attr('y', height - 50)
				.attr('rx', 2)
				.attr('ry', 2)
				.attr('width', 120)
				.attr('height', 20)
				.attr('stroke-width', 1)
				.attr('stroke', 'grey')
				.attr('fill', '#ddd');

			var cbut_text = 'Reveal node(s)';

			var ctext = cbutton.append('text')
				.style('font-size', '12px')
		  		.attr('fill', 'black')
		  		.attr('x', width - 120)
		  		.attr('y', height-36  )
		  		.text(cbut_text);
		  	}
		if(qType === 1 || qType === 101)
		{
				radiobox('g1', x, y);

			legend.append('text')
				.style('font-size', '14px')
				.attr('x', textX)
				.attr('y', y)
				.attr('fill', 'black')
				.attr('dominant-baseline', 'middle')
				.text('Blue Graph');


			y += 40;
			radiobox('g2', x,  y);

			legend.append('text')
				.style('font-size', '14px')
				.attr('x', textX)
				.attr('y', y)
				.attr('fill', 'black')
				.attr('dominant-baseline', 'middle')
				.text('Red Graph');


			/*radiobox('g3', x, y);

			legend.append('text')
				.style('font-size', '14px')
				.attr('x', textX)
				.attr('y', y)
				.attr('fill', 'black')
				.attr('dominant-baseline', 'middle')
				.text('Graph 3');


			y += 20;
			radiobox('g4', x, y);

			legend.append('text')
				.style('font-size', '14px')
				.attr('x', textX)
				.attr('y', y)
				.attr('fill', 'black')
				.attr('dominant-baseline', 'middle')
				.text('Graph 4');
			*/

		}

		else if (qType === 2 || qType === 102 || qType === 4 || qType === 104 )
		{

			y += 20;
			//radiobox('g2', x, y);

			legend.append('text')
				.style('font-size', '14px')
				.attr('x', textX - 30)
				.attr('y', y )
				.attr('fill', 'black')
				.attr('dominant-baseline', 'middle')
				.text('Shift+Click node to select');



		}

		else if((qType === 3 || qType === 103))
		{
			listBox = textbox('g0', x+30, y+20);
			/*
			radiobox('g1', x, y);

			legend.append('text')
				.style('font-size', '14px')
				.attr('x', textX)
				.attr('y', y)
				.attr('fill', 'black')
				.attr('dominant-baseline', 'middle')
				.text('1 - 2 nodes');


			y += 20;
			radiobox('g2', x,  y);

			legend.append('text')
				.style('font-size', '14px')
				.attr('x', textX)
				.attr('y', y)
				.attr('fill', 'black')
				.attr('dominant-baseline', 'middle')
				.text('3 - 5 nodes');


			y += 20;
			radiobox('g3', x, y);

			legend.append('text')
				.style('font-size', '14px')
				.attr('x', textX)
				.attr('y', y)
				.attr('fill', 'black')
				.attr('dominant-baseline', 'middle')
				.text('No difference');
			*/

		}

		else if(qType === 103)
		{
		radiobox('g1', y);

		legend.append('text')
			.style('font-size', '14px')
			.attr('x', sep1+60)
			.attr('y', y)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('Increases');



		y += 20;
		radiobox('g2', y);

		legend.append('text')
			.style('font-size', '14px')
			.attr('x', sep1+60)
			.attr('y', y)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('Decreases');

		//legend.each($P.D3.Small.appender({
		//	x: leftX + 99,
		//	y: y}));

		y += 20;
		radiobox('g3', y);

		legend.append('text')
			.style('font-size', '14px')
			.attr('x', sep1+60)
			.attr('y', y)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('Remains the same');

		}

		 x = sep1 + width* 0.15;
		 y = 20;
		  legend.append('text')
			.style('font-size', '14px')
			.attr('x', x + 65)
			.attr('y', y)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('Certainty');

			y += 20;
			legend.append('text')
			.style('font-size', '11px')
			.attr('x', x)
			.attr('y', y)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('Low');


			legend.append('text')
			.style('font-size', '11px')
			.attr('x', x + 180)
			.attr('y', y)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('High');

			y += 15;
			x += 5;
			legend.append('text')
			.style('font-size', '11px')
			.attr('x', x)
			.attr('y', y)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('1');

			x += 30;
			legend.append('text')
			.style('font-size', '11px')
			.attr('x', x)
			.attr('y', y)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('2');

			x += 30;
			legend.append('text')
			.style('font-size', '11px')
			.attr('x', x)
			.attr('y', y)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('3');

			x += 30;
			legend.append('text')
			.style('font-size', '11px')
			.attr('x', x)
			.attr('y', y)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('4');

			x += 30;
			legend.append('text')
			.style('font-size', '11px')
			.attr('x', x)
			.attr('y', y)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('5');

			x += 30;
			legend.append('text')
			.style('font-size', '11px')
			.attr('x', x)
			.attr('y', y)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('6');

			x += 30;
			legend.append('text')
			.style('font-size', '11px')
			.attr('x', x)
			.attr('y', y)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('7');

			y += 25;
			x = sep1 + width * 0.15 + 15; ;
			 scalebox('s1', x, y);
			 x += 30;
			 scalebox('s2', x, y);
			x += 30;
			 scalebox('s3', x, y);
			 x += 30;
			 scalebox('s4', x, y);
			 x += 30;
			 scalebox('s5', x, y);
			 x += 30;
			 scalebox('s6', x, y);
			 x += 30;
			 scalebox('s7', x, y);
			}


			if(time_limited)
			{
				but_state = true;
				but_color = 'green';
				but_rect.attr('stroke', but_color);
				conceal = legend.append('rect')
								.attr('x', sep1+4)
								.attr('y', 5)
								.attr('width', sep2 - sep1 - 15)
								.attr('height', height - 30)
								.attr('stroke', 'white')
								.attr('fill','white');

			}
			if(qType === 200)
			    content.hideGraph('Click \'Start\' when ready', 'Task 1:  For the subnetwork containing the most nodes, \n mark the nodes that are missing in one graph but not the other.');
		///////////////////////////////////////////////////////////////////////////////////////////

		// Create Button "Next Question"


		var answerToRecord;
		var toRecord;
		var titleW = 1300;
		var titleH = 150;
		var exp_ready = false;

		button.on("click", function() {

				var qid = content.parent.getQid();
				 if(qid >= 200  && qid <= 202) // 203
				 	{
				 		but_color = 'green';
						but_rect.attr('stroke', but_color);
						content.parent.newQuestion();
					    qid = content.parent.getQid();
						
						if(qid === 203 || qid === 205 || qid === 207)
						{
							// setup for practice to begin

							//qType = 101;
		  					//content.parent.setQid(101);
		  				
		  					//curQ = displayPractice(0);
		  					qType = content.parent.getQtype();
				  			titleScreen(parentSelection, '', titleW, titleH, 'Task 1: For the subnetwork containing the most nodes, \n sadfas mark the nodes that are missing in one graph but not the other.', 'Start', 101, content.parent, []); // ['Please make sure to select the graph in which node X is missing', 'Click the "Begin Practice" button when ready']);
							but_state = false; 
							but_color = 'red';
							but_rect.attr('stroke', but_color);
						}
						else{
							// load next training
							curQ = displayNone();
							but_color = 'green';
							but_rect.attr('stroke', but_color);
						
							event = {
												name: 'addGraph',
												question: content.parent.getQid(),
												reload: true
												};
							//console.log('View will now request reload');
							content.parent.receiveEvent(event);

							}
						

				 	}
				else 
				{
				 if(but_state)
				  {

					//content.parent.getNodeSelection();
				  if (qType > 100 && qType < 200)
				  {
				  
				  	 qi++;
				  	 
				  	 var pCount = content.parent.getPcount();
				  	 console.log('Here is pCount: '+ pCount);
				   if(pCount >= numPractice)  // the user just finished the last practice task
				    {

				    	if(qType === 102 || qType === 2 || qType === 104 || qType === 4)
		  					answerToRecord = content.parent.getNodeSelection();
		  				else
		  					answerToRecord = self.curSelection;

		  				toRecord = {
		  							answer: answerToRecord,
		  							certainty: self.curCertainty
		  							};

				    	var answer = content.parent.recordAnswer(toRecord);
				    	if(answer)
				    	{
				    	
				    	curQ.remove();
				    	var thanks = legend.append('text')
							.style('font-size', '16px')
							.style('font-weight', 'bold')
							.style('font-decoration', 'underline')
							.attr('fill', 'black')
							.attr('x', 20)
							.attr('y', 40)
							.attr('dominant-baseline', 'middle')
							.text('You have successfully completed the tutorial! Press "Start" to begin the experiment. ');

						exp_ready = true;

						legend.append('rect')
							.attr('x', sep1 + 10)
							.attr('y', 2)
							.attr('width', sep2 - sep1 - 20)
							.attr('height', 93)
							.attr('stroke-width', 1)
							.attr('stroke', 'white')
							.attr('fill', 'white');

		  				qType = 1;
		  				content.parent.setQid(-1);
		  				content.parent.newQuestion();
		  				}
		  			else {
		  				qi--;
		  			}

				    }
				    else {
				    	// load a new practice question
				    	if(qType === 102 || qType === 2 || qType === 104 || qType === 4)
		  					answerToRecord = content.parent.getNodeSelection();
		  				else
		  					answerToRecord = self.curSelection;
						toRecord = {
		  							answer: answerToRecord,
		  							certainty: self.curCertainty
		  							};

				    	var answer = content.parent.recordAnswer(toRecord);
				    	if(answer)
				    	{
				    		content.parent.newQuestion();
							var qid = content.parent.getQid();
							curQ.remove();

							curQ = displayPractice(qid - 202);
							but_color = 'red';
							but_rect.attr('stroke', but_color);
							pre_state = false;
							but_state=false;



				    	}
						else {
							qi--;
						}
				    }
				  }
				  else {

				  if(exp_ready)
				   {
				     exp_ready = false;
				   }

				  else {
					if(!time_limited) ql++;
					if (ql > numTrials)   // the user just answered the last question
					{
						// submit answers
						if(qType === 102 || qType === 2 || qType === 104 || qType === 4)
		  					answerToRecord = content.parent.getNodeSelection();
		  				else
		  					answerToRecord = self.curSelection;
						toRecord = {
		  							answer: answerToRecord,
		  							certainty: self.curCertainty
		  							};

						content.parent.recordAnswer(toRecord);
						content.parent.submitAnswers();
						// Display thank you message
						curQ.remove();
						var thanks = legend.append('text')
							.style('font-size', '16px')
							.style('font-weight', 'bold')
							.style('font-decoration', 'underline')
							.attr('fill', 'black')
							.attr('x', 20)
							.attr('y', 40)
							.attr('dominant-baseline', 'middle')
							.text('Thank you for your participation!');
						alert('Thank you for your participation!');
						but_state = false;
						pre_state = false;

					}

					else {
							if(time_limited)
							{
								content.override_timeout = true;
								content.parent.setEndT();
								conceal.remove();
								time_limited = false;
								but_color = 'red';
								but_state = false;
								but_rect.attr('stroke', but_color);
								but_text.remove();
								if(qid < (numTrials - 1))
								{
								but_text = button.append('text')
											.style('font-size', '16px')
											.attr('fill', 'black')
											.attr('x', sep2 +  width*0.33 / 4 - 35)
											.attr('y', height/2 - 8  )
											.text('Next');
								}
								else
								{
								but_text = button.append('text')
											.style('font-size', '16px')
											.attr('fill', 'black')
											.attr('x', sep2 +  width*0.33 / 4 - 35)
											.attr('y', height/2 - 8  )
											.text('Finish');


								}

								content.hideGraph('Please select answer');
							}
						else
						{
						// Load a new question
						but_state = false;
						pre_state = false;
						if(qType === 102 || qType === 2 || qType === 104 || qType === 4){
		  					content.parent.setEndT();
		  					answerToRecord = content.parent.getNodeSelection();
		  					}
		  				else
		  					answerToRecord = self.curSelection;
						toRecord = {
		  							answer: answerToRecord,
		  							certainty: self.curCertainty
		  							};

						if(qType !== 200) content.parent.recordAnswer(toRecord);
						content.parent.newQuestion();
						var qid = content.parent.getQid();
						if (curQ) curQ.remove();


						
						//console.log('View will now request reload');

						if(ql === 37 && content.parent.getTransition())
							{
								ql--;
								content.parent.resetTransition();
								content.hideGraph('Click Start when ready', 'Task 2: Estimate the number of node differences between the two graphs');
								but_color = 'green';
								but_rect.attr('stroke', but_color);
								but_text.remove();
								but_text = button.append('text')
											.style('font-size', '16px')
											.attr('fill', 'black')
											.attr('x', sep2 +  width*0.33 / 4 - 35)
											.attr('y', height/2 - 8  )
											.text('Start');
											but_state = true;
								 legend.append('rect')
									.attr('x', sep1+4)
									.attr('y', 5)
									.attr('width', sep2 - sep1 - 15)
									.attr('height', height - 30)
									.attr('stroke', 'white')
									.attr('fill','white');
							}
							//titleScreen(parentSelection, '', titleW, titleH, 'Task 2: Estimate the number of node differences between the two graphs', 'Start', qid, content.parent, [] );
																																						/*['Click on a node to highlight and add it to selection ',
				    																																' To de-select a highlighted node, click it again',
				    																																' Click "Next" once you have finalized your selection',
				    																																' Now, click the "Begin Practice" button to start']);*/
						
						else 
						{
							curQ = displayQuest(qid, ql, qt);
							but_color = 'red';
							but_rect.attr('stroke', but_color);

							event = {
												name: 'addGraph',
												question: content.parent.getQid(),
												reload: true
												};
							content.parent.receiveEvent(event);
						}
					}

					}
					}
					}
				  }
				 }
				});
		
		if(cbutton)
		{

			cbutton.on("click", function() { 
			content.parent.giveAnswer();
			});
		}
		//if(viewID === 1 && qType < 200) 
		content.parent.resetNodeSelection(); 

		return legend;
	};

$P.GraphForceView.makeDialog = function(parentSelection, myText, width, height, title, id, content) {
			var dialog = parentSelection.append('div')
			.attr('id', 'dialog-message')
			.attr('title', 'Important Information')
			.style('font-size', '16px')
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle');

			var dspan = dialog.append('span')
				//.attr('class','ui-widget-content')
				.style('color','white')
				.style('height', 50);

				/*
				dspan.append('span')
				.attr('class', 'ui-icon ui-icon-info')
				.style('float', 'left')
				.style('margin', '10px 7px 0 0');*/

			var ddiv = dialog.append('div')
						.style('margin-left', '23px');
				ddiv.append('p')
					.style('font-size', '16px')
					.attr('fill', 'white')
					.attr('dominant-baseline', 'middle')
					.text(myText);

			$(dialog).dialog({
				   	dialogClass: 'ui-dialog-osx',
				    //dialogClass: 'alert',
				    closeOnEscape: true,
					resizable: false,
					title: title,
					modal: true,
					width: width,
					height: height,
					position: ['center', 'center'],
					bgiframe: false,
					hide: {effect: 'scale', duration: 1},
					buttons: [{
								text: 'OK',
								click: function() {
									$(this).dialog('close');
									$("dialog-message").dialog("destroy");
									}
								}
								],
					close: function(event, ui){
						var titleW = 1200;
						var titleH = 150;
						var qid = content.parent.getQid();
						var pCount = content.parent.getPcount()-1; 
						console.log('pCount = ' + pCount);
						
						if(pCount === 6 && title === 'Perfect')
						titleScreen(parentSelection, '', titleW, titleH, 'Task 3: Estimate the number of node differences between the two graphs.', 'Start', qid, content.parent, []);
						 																																				/* ['Click on a node to highlight and add it to selection ',
				    																																	' Click on a selected node to de-select it',
				    																																					' Click "Next" once you have finalized your selection',
				    																																					' Now, click the "Begin Practice" button to start']); */
						//else if(pCount === 12 && title === 'Perfect')
						 //{
						 	//titleScreen(parentSelection, '', titleW, titleH, 'Task 3: Estimate the number of node differences between the two graphs.', 'Start', qid, content.parent, []);
						 																																				/* ['Observe the number of edges connected to H in each graph ',
				    																																					' If the number of edges for node H in graph 1 is N1',
				    																																					' And the number of edges for node H in graph 2 is N2',
				    																																					' Select "Increases" if N1 < N2',
				    																																					' Select "Decreases" if N1 > N2',
				    																																					' Select "Remains the same" if N1 = N2',
				    																																					' Now, click the "Begin Practice" button to start']); */
						 //}

						// else if(id === 115 && title === 'Perfect')
						//{
						// 	titleScreen(parentSelection, '', titleW, titleH, 'Task 4: Which of the group "X" nodes is/are connected to 4 or more nodes in all graphs?', 'Start', qid, content.parent, []);
						// }

						  else if(pCount === 18 && title === 'Perfect')
						 {
						 	titleScreen(parentSelection, 'You have completed the practice tasks!', 500, 600, 'Congratulations!', 'Start', qid, content.parent, ['Click the "Start" button to begin the experiment ']);
						 }
						 else if (title === 'Perfect')
						 {
						 event = {
												name: 'addGraph',
												question: content.parent.getQid(),
												reload: true
												};
							//console.log('View will now request reload');
							content.parent.receiveEvent(event);
						 }
					}
				});

	};


})(PATHBUBBLES);
