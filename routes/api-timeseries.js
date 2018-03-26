var express = require('express');
var router = express.Router();
var config = require('../config');
var http = require('http');

/*
Sample request

{
	"entityid": "urn.x-iot.smartsantander.1.3009",
	"timeframe": {
		"end_absolute": 1452981738000,
		"start_relative": {
		       "value": "1",
		       "unit": "days"
		}
	}
}

*/

router.post('/rawdata', function(req, res, next) {
	res.connection.setTimeout(0); // needed for long running tasks
	var id = req.body.entityid;
  	if (id == undefined){
  		res.status(404);
  		res.send({error: "entityid is required"});
  	}

  	//Build kairos query
  	var kairos_query = {
		   time_zone: "Europe/Madrid",
		   metrics: []
		};
  	var start_absolute = req.body.timeframe.start_absolute;
  	var end_absolute = req.body.timeframe.end_absolute;
  	var start_relative = req.body.timeframe.start_relative;
  	var end_relative = req.body.timeframe.end_relative;
  	var order = req.body.order;

  	if (start_absolute != undefined)
  	{
  		kairos_query.start_absolute = start_absolute;
  	}
  	if (start_relative != undefined)
  	{
  		kairos_query.start_relative = start_relative;
  	}
  	if (end_relative != undefined)
  	{
  		kairos_query.end_relative = end_relative;
  	}
  	if (end_absolute != undefined)
  	{
  		kairos_query.end_absolute = end_absolute;
  	}
	if (order == undefined) order = "desc";


	var metric = {
		           tags: {
		        	id: [id]
		           },
		           order: "desc",
		           //limit: 10000,
		           name: "payload"
		       };
	

    //Multitenancy
    if ('fiware-service' in req.headers && config.multitenancy)
    {
	metric.tags['fiware-service'] = req.headers['fiware-service'];
    }
    if ('fiware-servicepath' in req.headers && config.multitenancy)
    {
    	metric.tags['fiware-servicepath'] = req.headers['fiware-servicepath'];
    }
    //End Multitenancy

    kairos_query.metrics.push(metric);

  	var kdb = require('kairosdb'),
		  client = kdb.init(config.kairosdb.host, config.kairosdb.port, {debug: false});

  	
  	client.query(kairos_query, function (err, result) {
  		if (err) {
			console.log(err);
			//res.send(err);
		}
		else {
			var ngsi_entities = {};
			ngsi_entities.contextResponses = [];

			for (i=0;i<result.queries.length;i++)
			{
				if (result.queries[i].results == undefined || result.queries[i].results.length == 0) 
				{
					continue;
				}
				var metrics = result.queries[i].results;
				for (var b in metrics)
				{
					if (metrics[b].name == "payload")
					{
						for (var c in metrics[b].values)
						{
							console.log(metrics[b].values[c]);
							var item = metrics[b].values[c];
							//Decode payload. Payload is encoded in hexadecimal.
							var charEncoding='hex';
							var decodedPayload =new Buffer(item[1], charEncoding).toString('utf8');

							var ngsi_entity = {};
							ngsi_entity.contextElement = JSON.parse(decodedPayload);
							ngsi_entities.contextResponses.push(ngsi_entity);
							
						}
					}
				}
				res.send(ngsi_entities);

			}
		}
  	});
});


/*
Sample request

{
    "filters":{"type": ["bus"]},
    "group_by": [
		"district"
    ],
    "aggregators": [
		{
			"name": "speed",
			"aggregation": {
	           "name": "avg",
	           "sampling": {
	               "value": 10,
	               "unit": "minutes"
	           }
	        }
	    }
    ],
	"timeframe": {
		"end_relative": {
		       "value": "1",
		       "unit": "seconds"
		},
		"start_relative":{
		       "value": "1",
		       "unit": "days"
		}
	}
}

*/
router.post('/metrics', function(req, res, next) {
	
	res.connection.setTimeout(0); // needed for long running tasks

	var kairos_query = req.body.timeframe;
	kairos_query.time_zone = "Europe/Madrid";
	kairos_query.metrics = [];

	var tags_filter = req.body.filters;
	var order = req.body.order;

	//UGLY HACK: entities id values needs to convert : by . to query kairos. 
	//Kairos does not accept : in tags values
	for (var filter in tags_filter)
	{
		if (filter == "id")
		{
			for (var val in tags_filter.id)
			{
				tags_filter.id[val] = tags_filter.id[val];
			}
		}
	}
	
	var aggregators = req.body.aggregators;
	var group_by = req.body.group_by;

	var kairos_grouping = {};
	if (group_by.length>0){
		kairos_grouping = {
			name: "tag",
				tags: []
			};
	}
	for (var group in group_by)
	{
		kairos_grouping.tags.push(group_by[group]);
	}
	
	for (i=0;i<aggregators.length;i++) 
	{
		var metric = {};
		metric.tags = tags_filter;
		//Multitenancy
	    if ('fiware-service' in req.headers && config.multitenancy)
	    {
			metric.tags['fiware-service'] = req.headers['fiware-service'];
	    }
	    if ('fiware-servicepath' in req.headers && config.multitenancy)
	    {
	    	metric.tags['fiware-servicepath'] = req.headers['fiware-servicepath'];
	    }
	    //End Multitenancy
		metric.name = aggregators[i].name;
		metric.aggregators = [];
		
		if (group_by.length>0)
		{
			metric.group_by = [];
			metric.group_by.push(kairos_grouping);
		}

		//if (order == undefined) metric.order = "desc"
		//else metric.order = order;
		
		//Add align_sampling property to kairos query
		aggregators[i].aggregation.align_sampling = true;
		aggregators[i].aggregation.align_start_time = true;
		metric.aggregators.push(aggregators[i].aggregation);
		kairos_query.metrics.push(metric);
	}

	console.log(JSON.stringify(kairos_query));

	var 
	  kdb = require('kairosdb'),
		  client = kdb.init(config.kairosdb.host, config.kairosdb.port, {debug: false});

  	
  	client.query(kairos_query, function (err, result) {
		if (err) 
		{
			//console.log(JSON.stringify(err));
			//console.log(result);
			console.log(err);
			
			var respon = {};
			respon.error = true;
			respon.message = err.toString();
			res.status(400);
			res.send(respon);
		}
		else {
			//Yeah, we got the data!
			var query_result = []
			for (i=0;i<result.queries.length;i++)
			{
				var query = result.queries[i];
				
				for (a=0;a<query.results.length;a++)
				{
					var res1 = query.results[a];
					var result_set = {};
					result_set.grouped = false;
					result_set.values = {};
					result_set.group_by = {};
					//result_set.name = res1.name;
					
					var group_info = {};
					if (res1.group_by != undefined)
					{
						for (c=0;c<res1.group_by.length;c++)
						{
							if (res1.group_by[c].hasOwnProperty("group"))
							{
								//It is a grouped result
								result_set.grouped = true;
								result_set.group_by = res1.group_by[c].group;
							}
						}
					}
					else {
						result_set.grouped = false;
						result_set.group_by = [];
					}
					
					//Search for a previous result_set in which insert the metric. If the result_set has the same group_by information then
					var result_set_is_new = true;
					for (var index in query_result)
					{
						if (query_result[index].grouped == result_set.grouped && JSON.stringify(result_set.group_by) == JSON.stringify(query_result[index].group_by))
						{
							result_set = query_result[index];
							result_set_is_new = false;
						}
					}

					for (b=0;b<res1.values.length;b++)
					{
						if (result_set.values[res1.values[b][0]] == undefined) 
							result_set.values[parseInt(res1.values[b][0])] = {};

						result_set.values[res1.values[b][0]][res1.name] = res1.values[b][1];
					}
					if (result_set_is_new) query_result.push(result_set);
				}
			}
			console.log("sending result");
			//console.log(query_result);

			res.send(query_result);
		}
	});

});
module.exports = router;

