
$(function(){
  ymaps.ready(init);
  $("#nesterov-button").click(function() {sendAreaParams()});
  $("#clear-button").click(clearAreaParamsAndMap);
  window.lat_a = undefined;
  window.lon_a = undefined;
  window.lat_b = undefined;
  window.lon_b = undefined;
});

function init(){     
    window.map = new ymaps.Map("map", {
        center: [55.0, 95.0],
        zoom: 6
    });

    window.map.controls.remove("typeSelector");

    window.map.controls.remove("trafficControl");

    window.map.controls.remove("geolocationControl");

    window.map.controls.remove("fullscreenControl");

    window.map.controls.remove("rulerControl");

    window.map.controls.remove("searchControl");

    window.mySearchControl = new ymaps.control.SearchControl({
      options: {
        position: {
          left: 45,
          top: 65
        },
        provider: "yandex#map"
      }
    })

    window.map.controls.add(window.mySearchControl);

    window.map.behaviors.disable('rightMouseButtonMagnifier');

  SelectRectangleAreaByRightButton.prototype = {
      constructor: SelectRectangleAreaByRightButton,
      enable: function () {
          this._parent.getMap().events.add('contextmenu', this._onRightClick, this);
          this._parent.getMap().events.add('mousemove', this._onMove, this);
      },
      disable: function () {
          this._parent.getMap().events.remove('contextmenu', this._onRightClick, this);
          this._parent.getMap().events.remove('mousemove', this._onMove, this);
      },
      // Устанавливает родителя для исходного поведения
      setParent: function (parent) { this._parent = parent; },
      // Получает родителя
      getParent: function () { return this._parent; },
      //
      _onRightClick: function (e) {
          var coords = e.get('coords'); // координаты 
          var map = e.get('target'); // карта
          // меняем состояние на противоположное
          this.isSelecting = !this.isSelecting; 
          // Начинается выделение области
          if (this.isSelecting) { 
            window.lat_a = window.lon_a = window.lat_b = window.lon_b = undefined;
            this.beginPoint = coords; // запоминаем координаты одного угла в контексте
            // Если в контексте есть старая прямоугольная область то её нужно удалить
            if (this.rectangle !== undefined) {
              map.geoObjects.remove(this.rectangle);
              this.rectangle = undefined;
            }
            this.rectangle = new ymaps.Rectangle([coords, coords]); // новая прямоугольная область
            this.rectangle.events.add('mousemove', this._onMove, this); // нужно чтобы обрабатывалось перемещение мыши над уже выделенной областью 
            map.geoObjects.add(this.rectangle); // добавление новой области на карту
      } else { // Выделение области заканчивается
        window.lat_a = this.beginPoint[0];
        window.lon_a = this.beginPoint[1];
        window.lat_b = coords[0];
        window.lon_b = coords[1];
      }
      },

      _onMove: function (e) {
        if (this.isSelecting) { // если происходит выделение области
          var coords = e.get('coords');
            this.rectangle.geometry.setCoordinates([this.beginPoint, coords]); // изменяем один из углов выделяемой области в соответствии с координатами мыши
        }
      }
  };
  // Добавляем наше поведение 
  ymaps.behavior.storage.add('selectRectangleAreaByRightButton', SelectRectangleAreaByRightButton);
  // Включаем поведение
  window.map.behaviors.enable('selectRectangleAreaByRightButton');
 }

function SelectRectangleAreaByRightButton() {
    // Определим свойства класса
    this.options = new ymaps.option.Manager(); // Менеджер опций
    this.events = new ymaps.event.Manager(); // Менеджер событий
    this.isSelecting = false; // изначально мы не выделяем область
    this.beginPoint = undefined;
    this.rectangle = undefined;
}

function sendAreaParams() {
  if ((window.lon_a !== undefined) && (window.lat_a !== undefined) && (window.lon_b !== undefined) && (window.lat_b !== undefined)) {
    
    var data = { 
      lon_a: window.lon_a,
      lat_a: window.lat_a,
      lon_b: window.lon_b,
      lat_b: window.lat_b,
    };

    $.getJSON({
      url:"/fire_indices",
      data: data,
      success: function (response) {
        prepareNesterovCoefficientsData(response);
        drawCoefficientsMarks(window.map, window.max_lon, window.min_lon, window.max_lat, window.min_lat, 0.25, window.forecast_day_1)
      }
    });
  } else {
    alert('Перед отправкой данных нужно выделить область!');
  }
}

function clearAreaParamsAndMap () {
  window.max_lon = null
  window.max_lat = null
  window.min_lon = null
  window.min_lat = null
  window.forecast_day_1 = null
  window.forecast_day_2 = null
  window.forecast_day_3 = null
  window.forecast_day_4 = null
  window.forecast_day_5 = null
  window.forecast_day_6 = null
  window.forecast_day_7 = null

  $('#forecast_day_select').empty();

  window.map.geoObjects.removeAll();
}

function prepareNesterovCoefficientsData (jsonResponse) {
  window.max_lon = jsonResponse.max_lon
  window.max_lat = jsonResponse.max_lat
  window.min_lon = jsonResponse.min_lon
  window.min_lat = jsonResponse.min_lat
  window.forecast_day_1 = jsonResponse.forecast_day_1
  window.forecast_day_2 = jsonResponse.forecast_day_2
  window.forecast_day_3 = jsonResponse.forecast_day_3
  window.forecast_day_4 = jsonResponse.forecast_day_4
  window.forecast_day_5 = jsonResponse.forecast_day_5
  window.forecast_day_6 = jsonResponse.forecast_day_6
  window.forecast_day_7 = jsonResponse.forecast_day_7

  var forecast_timestamp = new Date(jsonResponse.timestamp)
}

function drawCoefficientsMarks (map, max_longitude, min_longitude, max_latitude, min_latitude, resolution, array_of_coefficients) {
  var counter = 0;
  map.geoObjects.removeAll();

  for (var latitude = min_latitude; latitude <= max_latitude; latitude += resolution) {
    for (var longitude = min_longitude; longitude <= max_longitude; longitude += resolution) {

      var placemark = new ymaps.Placemark([latitude, longitude], {},{
        preset: styleOfMark(array_of_coefficients[counter])
      });


      //placemark.events.add('click', placemarkClick);

      map.geoObjects.add(placemark);

      counter++;
    }
  }
}

function styleOfMark(nesterovCoefficients) {
  var color = ""
  if (nesterovCoefficients <= 300) {
    color = "blue";
  } else if (nesterovCoefficients <= 1000) {
    color = "darkGreen";
  } else if (nesterovCoefficients <= 4000) {
    color = "yellow";
  } else if (nesterovCoefficients <= 10000) {
    color = "darkOrange";
  } else {
    color = "red";
  }
  return 'islands#' + color  + 'CircleDotIcon'
}

function changeDayOfForecast () {
  var forecast_arr;

  switch (this.value) {
    case "1": forecast_arr = window.forecast_day_1;
    break;
    case "2": forecast_arr = window.forecast_day_2;
    break;
    case "3": forecast_arr = window.forecast_day_3;
    break;
    case "4": forecast_arr = window.forecast_day_4;
    break;
    case "5": forecast_arr = window.forecast_day_5;
    break;
    case "6": forecast_arr = window.forecast_day_6;
    break;
    case "7": forecast_arr = window.forecast_day_7;
    break;
  }
  drawCoefficientsMarks(window.map, window.max_lon, window.min_lon, window.max_lat, window.min_lat, 0.25, forecast_arr);
}
