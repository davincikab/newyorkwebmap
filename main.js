var map = L.map('map').setView([ 42.9946,  -75.9704], 8);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}' + (L.Browser.retina ? '@2x.png' : '.png'), {
   attribution:'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
   subdomains: 'abcd',
   maxZoom: 20,
   minZoom: 0
}).addTo(map);


let divIcon = L.divIcon({
   className:'map-marker'
});

// map layers
var k12Schools = L.geoJSON(null, {
   onEachFeature:function(feature, layer) {
      let popupString = "<div class='popup-content'><h6 class='title'>"+ feature.properties.LABEL_NAME +"</h6>"+
      // "<p><b>Address</b>"+ feature.properties.PHYSADDR_1+"</p>"+
      createPopupInfo(feature.properties) +
      "</div>";

      layer.bindPopup(popupString)
   },
   pointToLayer:function(feature, latLng) {
      return L.marker(latLng, {icon:divIcon});
   }
});

var schoolDistrict= L.geoJSON(null, {
   onEachFeature:function(feature, layer) {
      let popupString = "<div class='popup-content'><h6 class='title'>"+ feature.properties.SchDist +
      "</h6></div>";

      layer.bindPopup(popupString)
   },
   style:function(feature) {
      return {
         weight:0.7,
         fillColor:'#db1554',
         color:'#ddd'
      };

   }
});

var incomeLevel = L.geoJSON(null, {
   style:function(feature) {
      return {
         fillColor:getIncomeColor(feature.properties.Income),
         fillOpacity:0.9,
         weight:0.7,
         color:"#fff"
      }
   },
   onEachFeature:function(feature, layer) {
      let popupString = "<div class='popup-content'><h6 class='title'>"+ feature.properties.NAME_2 +"</h6>"+
         createPopupInfo(feature.properties) +
      "</div>";

      layer.bindPopup(popupString)
   }
}); 

function getIncomeColor(income) {
   let colors = ['#fde0c5','#facba6','#f8b58b','#f59e72','#f2855d','#ef6a4c','#eb4a40'];

   return !income ? colors[0] : income < 51000 ? colors[1] : income < 58000 ? colors[2] : income < 67000 ? colors[3] 
      : income < 81000 ? colors[4] : income < 97000 ? colors[5] : colors[6];
}


var covid19Rates = L.geoJSON(null, {
   style:function(feature) {
      return {
         fillColor:getCovidColor(feature.properties["Cumulative Number of Positives"]),
         fillOpacity:0.9,
         weight:0.7,
         color:"#ddd"
      }  
   },
   onEachFeature:function(feature, layer) {
      let popupString = "<div class='popup-content'><h6 class='title'>"+ feature.properties.NAME_2 +"</h6>"+
         createPopupInfo(feature.properties) +
      "</div>";

      layer.bindPopup(popupString)
   }
});

function getCovidColor(cumCount) {
   let colors = ['#ffffcc','#ffeda0','#fed976','#feb24c','#fd8d3c','#fc4e2a','#e31a1c','#b10026'];

   if(!cumCount ) return colors[0];

   return cumCount < 100 ? colors[0] : cumCount < 500 ? colors[1] : cumCount < 1000 ? colors[3] : cumCount < 5000 ? colors[4] :
   cumCount < 10000 ? colors[5] : cumCount < 15000 ? colors[6] : colors[7];
}

var broadbandAccess = L.geoJSON(null);   
var demographics = L.geoJSON(null);  
var csiTsiSchools = L.geoJSON(null);


function createPopupInfo(properties) {
   let tableElement = document.createElement('table');
   let keys = Object.keys(properties);

   keys.forEach((key) => {
      let tableRow = document.createElement('tr');
      tableRow.innerHTML = "<td class='itemKey'>"+ key +"</td><td class='itemValue'>"+ properties[key]+"</td>";

      tableElement.append(tableRow)
   });

   return tableElement.outerHTML;
};

// load map layers
let layers = [k12Schools, schoolDistrict, incomeLevel, covid19Rates, broadbandAccess, demographics, demographics, csiTsiSchools];
let dataUrls = ['publick12.geojson', 'schooldistrict_boundary.geojson','income_data.geojson', 'covid.geojson'];


dataUrls.forEach((url, index) => {
   // fetch the data
   fetch(`geojson/${url}`)
   .then(res => res.json())
   .then(data  => {
      console.log(data);

      console.log(layers[index]);
      layers[index].addData(data).addTo(map);
   })
   .catch(error => {
      console.error(error);
   });
});



// map layers
var overlay = {
   'Public K12 Schools':k12Schools,
   'School District Boundary': schoolDistrict,
   'Income Levels':incomeLevel,
   'Covid 19 Cumulative Cases':covid19Rates
}

L.control.layers({},overlay, {collapsed:false}).addTo(map);


// Income level legend
var legendControl = new L.Control({position:"bottomright"});
legendControl.onAdd = function(map) {
    let div = L.DomUtil.create("div", "accordion bg-white");

    div.innerHTML += '<button class="btn btn-block bg-light text-left" type="button" data-toggle="collapse" data-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">'+
    'Income Levels</button>';
   
    let values = ["", 50000, 57000, 66000, 80000, 96000, 105000];
    let labels = ['Unknown',' < 51000',  '< 66000', '< 80000', '< 96000', '< 105000'];

    let legendItems = "";
    values.forEach((value, index) => {
        let color = getIncomeColor(value);
        let name = labels[index]
        legendItems += "<div class='legend_wrapper'><div class='legend-item' style='background-color:"+color+"'></div><span>"+name+"</span></div>";
    });

    div.innerHTML += '<div class="collapse" id="collapseOne">'+ legendItems +'</div>';

    return div;
}

legendControl.addTo(map);


// Covid 19 level legend
var covid19LegendControl = new L.Control({position:"bottomleft"});
covid19LegendControl.onAdd = function(map) {
    let div = L.DomUtil.create("div", "accordion bg-white");

    div.innerHTML += '<button class="btn btn-block bg-light text-left" type="button" data-toggle="collapse" data-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">'+
    'Cumulative Number of Positives</button>';
   
    let values = [0, 100, 500, 1000, 5000, 10000, 15000, 20000];
    let labels = ["0-99", "100-499", "500 - 999", "1000 - 4999", "5000 - 9999", "10000 - 14999", "15000 - 19999", "20000 + "];

    let legendItems = "";
    values.forEach((value, index) => {
        let color = getCovidColor(value);
        let name = labels[index]
        legendItems += "<div class='legend_wrapper'><div class='legend-item' style='background-color:"+color+"'></div><span>"+name+"</span></div>";
    });

    div.innerHTML += '<div class="collapse" id="collapseOne">'+ legendItems +'</div>';

    return div;
}

covid19LegendControl.addTo(map);

map.on('overlayremove', function(e) {
   console.log(e);
   if(e.name == "Income Levels") {
      map.removeControl(legendControl);
   } else if (e.name == "Covid 19 Cumulative Cases") {
      map.removeControl(covid19LegendControl);  
   }
});

map.on('overlayadd', function(e) {
   console.log(e);
   if(e.name == "Income Levels") {
     legendControl.addTo(map);
   } else if (e.name == "Covid 19 Cumulative Cases") {
      map.addControl(covid19LegendControl);  
   }
});