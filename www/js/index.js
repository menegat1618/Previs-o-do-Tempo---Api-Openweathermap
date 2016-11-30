document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
	$(document).ready(function() {
		DataBase.initDB();
		DataBase.showCities();
		hider();
		navigator.geolocation.getCurrentPosition(onSuccess, onError, {timeout: 5000, enableHighAccuracy: true});
		$("#search").click(function(){
			cleaner();
			if(!($("input").val()=="")){
				cidade = $("input").val();
				if ($(":radio").is(":checked")){
					obj={city:cidade}
					DataBase.addCity(obj);
					
				}
				cidade = 'q=' + cidade
			}
			else{
				cidade = "lat=-27.2288744&lon=-52.0107103"
			};
			DataBase.showCities();
			url = "http://api.openweathermap.org/data/2.5/weather?" + cidade;
			url1 = "http://api.openweathermap.org/data/2.5/forecast?" + cidade;
			$(":radio").attr('checked', false).checkboxradio('refresh');
			$(":text").val("");
					
			$('.links').click(function(){
				city = $(this).attr('id');
				$('#myModal').modal('toggle');
				$(":text").val(city);
				$('#search').click();
			});
			
			$('#clean').click(function(){
				DataBase.clearCollection()	
			});
			apiCall(url, url1);
		});
	});
};

function apiCall (url, url1){
	$.ajax({
		method: "GET",
		url: url,
		data: {
			lang: "pt",
			units: "metric",
			APPID: "24f6579105cfd9ec8d4d4c789cf50a07"
		},
		dataType: "json",
		success: function(response) {
			console.log(response);
			currentDay(response);
		},
		failure: function(response) {
			console.error(response);
		}
	});


	$.ajax({
		method: "GET",
		url: url1,
		data: {
			lang: "pt",
			units: "metric",
			APPID: "24f6579105cfd9ec8d4d4c789cf50a07"
		},
		dataType: "json",
		success: function(response) {
			console.log(response);
			getData(response);
			showDays();
			effect(1, $("#1"));
			daysData(1);
			$("#forecast div").click(function(){
				id = parseInt($(this).attr('id'));
				effect(id, $(this));
				daysData(id);
			});
		},
		failure: function(response) {
			console.error(response);
		}
	});
};

function cleaner(){
	$("#forecast-data table tbody").empty()
};

function hider(){
	$("#forecast div").each(function() {
       $(this).hide(0);
    });
	$("#forecast-data table").hide(0);
};

function effect(id, div){
	div.css('background-color', 'rgba(14,26,52,1)')
	$('#forecast div').each(function() {
        if ($(this).attr('id')!= id && $(this).css('background-color', 'rgba(14,26,52,1)')){
			$(this).css('background-color', 'rgba(14,31,88,0.6)')
		};
    });
};

function currentDay (response){
	$("#current").html(response.main.temp+"º");
	$("#min-max").html(
		response.main.temp_min+"° - "+
		response.main.temp_max+"°"
	);
	$("#city").html(response.name);
	$("#description").html(response.weather[0].description);
	$("#humidity").html(response.main.humidity+"%");
	url = response.weather[0].icon
	$("#current_icon").attr("src", "icons/"+url+".png")
};

function getData (response){
	list = response.list;
	dt_array = [];
	hour_array = [[],[],[],[],[],[]];
	index_array = [[],[],[],[],[],[]];
	line = 0
	for (index in list){
		date = list[index].dt_txt.split(" ");
		if (dt_array.indexOf(date[0]) < 0){
			dt_array.push(date[0]);
			hour_array[line].push(date[1]);
			index_array[line].push(index);
			line ++;
		}
		else{
			index_array[line-1].push(index);
			hour_array[line-1].push(date[1]);
		};
	};
	return (list, dt_array, index_array, hour_array)
};

function showDays(){
	$("#forecast div").each(function() {
		id = parseInt($(this).attr('id'));
		img_id = "#icon"+id;
		p_id = "#p"+id;
		if (!(id > dt_array.length)){
			date = dt_array[id-1].split("-")
			$(p_id).html(date[2]+"/"+date[1]+"/"+date[0]);
			url = list[index_array[id-1][0]].weather[0].icon;
			$(img_id).attr('src', "icons/"+url+".png");
			$(this).show(1000);
		};
	});
};

function daysData(id){
	var obj;
	var hora;
	var url;
	cleaner()
	for (index in index_array[id-1]){
		obj = index_array[id-1][index]
		hora = hour_array[id-1][index].split(':')
		url =  list[obj].weather[0].icon;
		showTemplate(obj, hora, url);
	};
	$("#forecast-data table").show(1000);
};

function showTemplate(obj, hora, url){
	var context = {
		hour: hora[0] +":"+ hora[1],
		temp: list[obj].main.temp + "°",
		url: "icons/"+url+".png",
		description: list[obj].weather[0].description,
		humidity: list[obj].main.humidity+ "%",
		temp_min_max: list[obj].main.temp_min + "° - " + list[obj].main.temp_max + "°"
	};
	var source = $("#entry-template").html();
	var template = Handlebars.compile(source);
	var html = template(context);
	$("#forecast-data table tbody").append(html);
};

function onSuccess(position){
	lat = position.coords.latitude;
	lon = position.coords.longitude;
	url = "http://api.openweathermap.org/data/2.5/weather?lat=" + lat + "&lon=" + lon;
	url1 = "http://api.openweathermap.org/data/2.5/forecast?lat=" + lat + "&lon=" + lon
	apiCall(url, url1);
	return
	};
	
function onError(error){
	if (error.code == error.TIMEOUT) {
    	alert('O GPS talvez não esteja ligado!');
    } else if (error.code == error.PERMISSION_DENIED) {
    	alert('Serviço de Localização Desligado!');
    } else if (error.code == error.POSITION_UNAVAILABLE) {
    	alert('Impossível obter posição!');
    };
};

var DataBase = {
	
	initDB: function (){
		this.db = new loki('cities_db.db', {
			autosave: true,
			autosaveInterval: 1000,
			autoload: true
		});
		this.db.loadDatabase();
		this.cities = this.db.getCollection('cities_db');
		
		if (!this.cities) {
			this.cities = this.db.addCollection('cities_db');
		};
	},
	
	addCity: function(city){
		cities = this.db.getCollection('cities_db');
		cities.insert(city);
	},
	
	showCities: function(){
		$('#city-list').empty();
		cities = this.db.getCollection('cities_db');

        if (cities.data.length <= 0) {
            var element = '<li><b>Nenhuma cidade foi procurada ainda.</b></li>';
            $('#city-list').append(element);                  
        };

        cities.data.forEach(function(city) {
            var element = "<li><a class='links' id="+ city.city +" href='#'><b>"+ city.city +'</b></a></li>';
            $('#city-list').append(element);
		

        });
	},
	
	clearCollection: function(){
		cities.clear();
		$('#city-list').empty();
	}
};